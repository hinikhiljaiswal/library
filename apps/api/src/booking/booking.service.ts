import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isMongoServerErrorWithCode } from '../database/mongo-error';
import { SeatPricingService } from '../seat/seat-pricing.service';
import { SeatStatus } from '../seat/seat.types';
import { activeStatuses, calculateAmount, overlappingShifts } from './booking-rules';
import { CreateBookingDto } from './dto/create-booking.dto';
import { AdminCreateBookingDto, AdminUpdateBookingDto } from './dto/admin-booking.dto';
import { Booking, BookingDocument, BookingStatus } from './booking.schema';
import { FilterQuery, Model, Types } from 'mongoose';

@Injectable()
export class BookingService {
  constructor(
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
    private readonly pricing: SeatPricingService,
  ) {}

  async createPendingBooking(dto: CreateBookingDto) {
    const seat = await this.pricing.getSeatWithPrice(dto.seatId);
    const amount = calculateAmount(seat.price, dto.shift);
    await this.assertNoActiveConflict(dto.seatId, dto.date, dto.shift);

    try {
      return await this.bookingModel.create({
        ...dto,
        amount,
        status: 'pending',
        source: 'online',
      });
    } catch (error) {
      if (isMongoServerErrorWithCode(error, 11000)) {
        throw new ConflictException('This seat is already held or booked for the selected shift.');
      }

      throw error;
    }
  }

  async attachStripeSession(bookingId: string, stripeSessionId: string) {
    return this.bookingModel.findByIdAndUpdate(bookingId, { stripeSessionId }, { new: true }).orFail();
  }

  async markPaidByStripeSession(stripeSessionId: string) {
    return this.bookingModel
      .findOneAndUpdate({ stripeSessionId }, { status: 'paid' }, { new: true })
      .orFail(new NotFoundException('Booking not found for Stripe session'));
  }

  async cancelByStripeSession(stripeSessionId: string) {
    return this.bookingModel.findOneAndUpdate(
      { stripeSessionId, status: 'pending' },
      { status: 'cancelled' },
      { new: true },
    );
  }

  async cancelById(bookingId: string) {
    return this.bookingModel.findOneAndUpdate(
      { _id: bookingId, status: 'pending' },
      { status: 'cancelled' },
      { new: true },
    );
  }

  async listAdminBookings(filters: {
    status?: BookingStatus;
    date?: string;
    shift?: string;
    seatId?: string;
    search?: string;
  }) {
    const query: FilterQuery<BookingDocument> = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.date) {
      query.date = filters.date;
    }

    if (filters.shift) {
      query.shift = filters.shift;
    }

    if (filters.seatId) {
      query.seatId = filters.seatId;
    }

    if (filters.search) {
      const search = new RegExp(filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ studentName: search }, { email: search }, { phone: search }, { seatId: search }];
    }

    const [bookings, stats] = await Promise.all([
      this.bookingModel.find(query).sort({ date: -1, createdAt: -1 }).lean({ virtuals: true }),
      this.getAdminStats(),
    ]);

    return { bookings, stats };
  }

  async createAdminBooking(dto: AdminCreateBookingDto) {
    const seat = await this.pricing.getSeatWithPrice(dto.seatId);
    const amount = calculateAmount(seat.price, dto.shift);

    if (activeStatuses.includes(dto.status as (typeof activeStatuses)[number])) {
      await this.assertNoActiveConflict(dto.seatId, dto.date, dto.shift);
    }

    try {
      return await this.bookingModel.create({
        ...dto,
        amount,
        source: 'admin',
      });
    } catch (error) {
      if (isMongoServerErrorWithCode(error, 11000)) {
        throw new ConflictException('This seat is already held or booked for the selected shift.');
      }

      throw error;
    }
  }

  async updateAdminBooking(bookingId: string, dto: AdminUpdateBookingDto) {
    const booking = await this.bookingModel.findById(bookingId).orFail(new NotFoundException('Booking not found'));
    const next = {
      seatId: dto.seatId ?? booking.seatId,
      date: dto.date ?? booking.date,
      shift: dto.shift ?? booking.shift,
      status: (dto.status ?? booking.status) as BookingStatus,
    };

    const seat = await this.pricing.getSeatWithPrice(next.seatId);
    const amount = calculateAmount(seat.price, next.shift);

    if (activeStatuses.includes(next.status as (typeof activeStatuses)[number])) {
      await this.assertNoActiveConflict(next.seatId, next.date, next.shift, booking.id);
    }

    booking.set({
      ...dto,
      amount,
    });

    try {
      return await booking.save();
    } catch (error) {
      if (isMongoServerErrorWithCode(error, 11000)) {
        throw new ConflictException('This seat is already held or booked for the selected shift.');
      }

      throw error;
    }
  }

  async deleteAdminBooking(bookingId: string) {
    const booking = await this.bookingModel.findByIdAndDelete(bookingId).orFail(new NotFoundException('Booking not found'));
    return { deleted: true, booking };
  }

  async expirePendingBookings() {
    const result = await this.bookingModel.updateMany({ status: 'pending' }, { status: 'expired' });
    return { updated: result.modifiedCount };
  }

  async getBlockedSeatMap(date?: string, shift?: string): Promise<Map<string, SeatStatus>> {
    const query = {
      status: { $in: activeStatuses },
      ...(date ? { date } : {}),
      ...(shift ? { shift: { $in: overlappingShifts(shift) } } : {}),
    };
    const bookings = await this.bookingModel.find(query).lean();

    return bookings.reduce((map, booking) => {
      map.set(booking.seatId, booking.status === 'paid' ? 'booked' : 'pending');
      return map;
    }, new Map<string, SeatStatus>());
  }

  private async assertNoActiveConflict(seatId: string, date: string, shift: string, ignoredBookingId?: string) {
    const query: FilterQuery<BookingDocument> = {
      seatId,
      date,
      shift: { $in: overlappingShifts(shift) },
      status: { $in: activeStatuses },
    };

    if (ignoredBookingId) {
      query._id = { $ne: new Types.ObjectId(ignoredBookingId) };
    }

    const existing = await this.bookingModel.exists(query);
    if (existing) {
      throw new ConflictException('This seat is already held or booked for the selected date and shift.');
    }
  }

  private async getAdminStats() {
    const [statusCounts, revenue] = await Promise.all([
      this.bookingModel.aggregate<{ _id: BookingStatus; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.bookingModel.aggregate<{ _id: null; total: number }>([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    return {
      total: statusCounts.reduce((sum, item) => sum + item.count, 0),
      pending: statusCounts.find((item) => item._id === 'pending')?.count ?? 0,
      paid: statusCounts.find((item) => item._id === 'paid')?.count ?? 0,
      cancelled: statusCounts.find((item) => item._id === 'cancelled')?.count ?? 0,
      expired: statusCounts.find((item) => item._id === 'expired')?.count ?? 0,
      revenue: revenue[0]?.total ?? 0,
    };
  }
}

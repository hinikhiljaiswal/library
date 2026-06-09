import { Injectable } from '@nestjs/common';
import { BookingService } from '../booking/booking.service';
import { SeatPricingService } from './seat-pricing.service';
import { SeatWithStatus } from './seat.types';

@Injectable()
export class SeatService {
  constructor(
    private readonly bookings: BookingService,
    private readonly pricing: SeatPricingService,
  ) {}

  async listSeats(date?: string, shift?: string): Promise<SeatWithStatus[]> {
    const [blockedSeats, seats] = await Promise.all([
      this.bookings.getBlockedSeatMap(date, shift),
      this.pricing.listSeatsWithPrices(),
    ]);

    return seats.map((seat) => ({
      ...seat,
      status: blockedSeats.get(seat.id) ?? 'available',
    }));
  }
}

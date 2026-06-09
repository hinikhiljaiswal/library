import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { BookingService } from '../booking/booking.service';
import { BookingStatus } from '../booking/booking.schema';
import { AdminCreateBookingDto, AdminUpdateBookingDto } from '../booking/dto/admin-booking.dto';
import { AdminGuard } from './admin.guard';

@Controller('admin/bookings')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly bookings: BookingService) {}

  @Get()
  listBookings(
    @Query('status') status?: BookingStatus,
    @Query('date') date?: string,
    @Query('shift') shift?: string,
    @Query('seatId') seatId?: string,
    @Query('search') search?: string,
  ) {
    return this.bookings.listAdminBookings({ status, date, shift, seatId, search });
  }

  @Post()
  createBooking(@Body() dto: AdminCreateBookingDto) {
    return this.bookings.createAdminBooking(dto);
  }

  @Patch(':id')
  updateBooking(@Param('id') id: string, @Body() dto: AdminUpdateBookingDto) {
    return this.bookings.updateAdminBooking(id, dto);
  }

  @Delete(':id')
  deleteBooking(@Param('id') id: string) {
    return this.bookings.deleteAdminBooking(id);
  }

  @Post('expire-pending')
  expirePending() {
    return this.bookings.expirePendingBookings();
  }
}

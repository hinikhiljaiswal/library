import { Module } from '@nestjs/common';
import { BookingModule } from '../booking/booking.module';
import { SeatPricingModule } from '../seat/seat-pricing.module';
import { AdminController } from './admin.controller';
import { AdminGuard } from './admin.guard';
import { AdminSeatPricingController } from './admin-seat-pricing.controller';

@Module({
  imports: [BookingModule, SeatPricingModule],
  controllers: [AdminController, AdminSeatPricingController],
  providers: [AdminGuard],
})
export class AdminModule {}

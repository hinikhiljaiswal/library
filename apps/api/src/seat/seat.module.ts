import { Module } from '@nestjs/common';
import { BookingModule } from '../booking/booking.module';
import { SeatPricingModule } from './seat-pricing.module';
import { SeatController } from './seat.controller';
import { SeatService } from './seat.service';

@Module({
  imports: [BookingModule, SeatPricingModule],
  controllers: [SeatController],
  providers: [SeatService],
})
export class SeatModule {}

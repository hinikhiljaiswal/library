import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeatPricingModule } from '../seat/seat-pricing.module';
import { Booking, BookingSchema } from './booking.schema';
import { BookingService } from './booking.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]), SeatPricingModule],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeatPricing, SeatPricingSchema } from './seat-pricing.schema';
import { SeatPricingService } from './seat-pricing.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: SeatPricing.name, schema: SeatPricingSchema }])],
  providers: [SeatPricingService],
  exports: [SeatPricingService],
})
export class SeatPricingModule {}

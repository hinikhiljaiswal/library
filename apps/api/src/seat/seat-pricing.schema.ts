import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SeatPricingDocument = HydratedDocument<SeatPricing>;

@Schema({ timestamps: true })
export class SeatPricing {
  @Prop({ required: true, unique: true, index: true })
  seatId: string;

  @Prop({ required: true, min: 1 })
  price: number;
}

export const SeatPricingSchema = SchemaFactory.createForClass(SeatPricing);

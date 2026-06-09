import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BookingDocument = HydratedDocument<Booking>;
export type BookingStatus = 'pending' | 'paid' | 'expired' | 'cancelled';
export type BookingSource = 'online' | 'admin';

@Schema({ timestamps: true })
export class Booking {
  @Prop({ required: true, index: true })
  seatId: string;

  @Prop({ required: true })
  studentName: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  shift: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: ['pending', 'paid', 'expired', 'cancelled'], default: 'pending', index: true })
  status: BookingStatus;

  @Prop({ required: true, enum: ['online', 'admin'], default: 'online' })
  source: BookingSource;

  @Prop()
  notes?: string;

  @Prop({ index: true })
  stripeSessionId?: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

BookingSchema.index(
  { seatId: 1, date: 1, shift: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'paid'] } },
  },
);

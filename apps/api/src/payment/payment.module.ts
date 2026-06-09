import { Module } from '@nestjs/common';
import { BookingModule } from '../booking/booking.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [BookingModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}

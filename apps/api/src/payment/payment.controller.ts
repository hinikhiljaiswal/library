import { Body, Controller, Headers, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { CreateBookingDto } from '../booking/dto/create-booking.dto';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly payments: PaymentService) {}

  @Post('checkout')
  createCheckout(@Body() dto: CreateBookingDto) {
    return this.payments.createCheckout(dto);
  }

  @Post('webhook')
  webhook(@Headers('stripe-signature') signature: string | undefined, @Req() request: Request & { rawBody?: Buffer }) {
    return this.payments.handleWebhook(signature, request.rawBody);
  }

  @Post('success/:sessionId')
  confirmSuccess(@Param('sessionId') sessionId: string) {
    return this.payments.confirmSuccess(sessionId);
  }

  @Post('cancel/:sessionId')
  cancel(@Param('sessionId') sessionId: string) {
    return this.payments.cancel(sessionId);
  }
}

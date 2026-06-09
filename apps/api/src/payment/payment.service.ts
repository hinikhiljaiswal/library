import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { BookingService } from '../booking/booking.service';
import { CreateBookingDto } from '../booking/dto/create-booking.dto';

@Injectable()
export class PaymentService {
  private readonly stripe: Stripe;

  constructor(
    private readonly config: ConfigService,
    private readonly bookings: BookingService,
  ) {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey && !this.isMockMode()) {
      throw new InternalServerErrorException('STRIPE_SECRET_KEY is missing');
    }

    this.stripe = new Stripe(secretKey || 'sk_test_mock_mode');
  }

  async createCheckout(dto: CreateBookingDto) {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY') ?? '';
    if (secretKey.includes('replace_me') && !this.isMockMode()) {
      throw new BadRequestException('Add your Stripe test secret key in apps/api/.env before taking payments.');
    }

    const booking = await this.bookings.createPendingBooking(dto);
    const webUrl = this.config.get<string>('WEB_APP_URL') ?? 'http://localhost:3000';

    if (this.isMockMode()) {
      const sessionId = `mock_${booking.id}_${Date.now()}`;
      await this.bookings.attachStripeSession(booking.id, sessionId);

      return {
        checkoutUrl: `${webUrl}/success?session_id=${sessionId}&mock=true`,
        sessionId,
        mock: true,
      };
    }

    try {
      const session = await this.stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: booking.email,
        success_url: `${webUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${webUrl}/cancel?session_id={CHECKOUT_SESSION_ID}`,
        metadata: {
          bookingId: booking.id,
          seatId: booking.seatId,
          date: booking.date,
          shift: booking.shift,
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'inr',
              unit_amount: booking.amount * 100,
              product_data: {
                name: `Study seat ${booking.seatId}`,
                description: `${booking.date} - ${booking.shift}`,
              },
            },
          },
        ],
      });

      await this.bookings.attachStripeSession(booking.id, session.id);

      return { checkoutUrl: session.url, sessionId: session.id };
    } catch (error) {
      await this.bookings.cancelById(booking.id);
      throw error;
    }
  }

  async handleWebhook(signature: string | undefined, rawBody: Buffer | undefined) {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret || !rawBody) {
      return { received: true, skipped: true };
    }

    const event = this.stripe.webhooks.constructEvent(rawBody, signature ?? '', webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await this.bookings.markPaidByStripeSession(session.id);
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      await this.bookings.cancelByStripeSession(session.id);
    }

    return { received: true };
  }

  async confirmSuccess(sessionId: string) {
    return this.bookings.markPaidByStripeSession(sessionId);
  }

  async cancel(sessionId: string) {
    return this.bookings.cancelByStripeSession(sessionId);
  }

  private isMockMode() {
    return this.config.get<string>('STRIPE_MOCK_MODE') === 'true';
  }
}

# Library Seat Booking

A self-study center booking app inspired by cinema seat selection. Students choose seats, enter details, and pay through Stripe Checkout. The backend uses NestJS, MongoDB, and Mongoose.

## Setup

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
npm run dev
```

Open `http://localhost:3000`.

Admin panel: `http://localhost:3000/admin`

Default local admin PIN:

```text
123456
```

## Required Services

- MongoDB running locally or a MongoDB Atlas connection string.
- Stripe secret key in `apps/api/.env`.
- Stripe webhook secret is optional for local UI testing, but recommended for production.

## Stripe Testing

This starter enables `STRIPE_MOCK_MODE=true` by default. In mock mode, checkout redirects directly to the success page and marks the booking paid, so you can test the full booking and admin workflow without a real Stripe key.

To test with real Stripe test mode:

1. Set `STRIPE_MOCK_MODE=false`.
2. Add your Stripe secret test key to `STRIPE_SECRET_KEY`.
3. Use Stripe test card `4242 4242 4242 4242` with any future expiry and any CVC.

## Stripe Webhook

For local webhook testing:

```bash
stripe listen --forward-to localhost:4001/payments/webhook
```

Paste the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.
# library

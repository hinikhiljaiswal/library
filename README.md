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

## Render Deployment

Do not use `npm run dev` on Render. Dev mode deletes or rebuilds `.next` while the server is running, which can cause `required-server-files.json` and CSS parse errors.

Deploy as two Render web services. In the Render dashboard, set the commands exactly like this.

API service:

```bash
Build Command: npm run render:api:build
Start Command: npm run render:api:start
```

Web service:

```bash
Build Command: npm run render:web:build
Start Command: npm run render:web:start
```

Render installs dependencies before running the Build Command, so do not put `npm install` in the Start Command.

The web service Start Command must not be `npm install && npm run build`. That command builds the app and exits, so Render will report "No open ports detected".

Set `NEXT_PUBLIC_API_URL` on the web service to the public URL of the API service.

## Required Services

- MongoDB Atlas connection string in `apps/api/.env`.
- Stripe secret key in `apps/api/.env`.
- Stripe webhook secret is optional for local UI testing, but recommended for production.

## MongoDB Atlas

Create a MongoDB Atlas cluster, add your current IP address in Network Access, then create a database user.

Update `apps/api/.env`:

```text
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/library-seat-booking?retryWrites=true&w=majority
```

Replace `<username>`, `<password>`, and `<cluster>` with your Atlas values. If your password contains special characters, URL-encode it before putting it in the connection string.

The `<cluster>` value must be the full Atlas host, such as `cluster0.abcde.mongodb.net`. Do not use a port, database name, or numeric value like `54321` in that position.

On Render, set `MONGODB_URI` as one full value. The database name must come after `.mongodb.net/`, not after `?`:

```text
mongodb+srv://USER:PASSWORD@cluster0.abcde.mongodb.net/library-seat-booking?retryWrites=true&w=majority
```

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

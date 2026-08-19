# ShopEase launch checklist

## Local development

1. Copy `server/.env.example` to `server/.env`.
2. Keep provider keys in environment variables only. Never commit `server/.env`.
3. Start one clean local stack with `npm run dev:clean`.
4. Check `http://localhost:5000/api/health` before testing checkout.

## Stripe test mode

1. Create Stripe test-mode API keys.
2. Set `STRIPE_SECRET_KEY` in the server environment.
3. Run `stripe listen --forward-to localhost:5000/api/payments/webhook`.
4. Set the printed `STRIPE_WEBHOOK_SECRET`.
5. Test success, cancellation, card failure, webhook retry, and insufficient stock.
6. Confirm the order changes only after the webhook marks it paid.

## Production providers

- Cloudinary or S3: product and partner media storage.
- Resend, SendGrid, or Postmark: order and account email.
- Twilio or another approved provider: optional SMS updates.
- Shiprocket, Shippo, or EasyPost: labels, tracking, and delivery events.
- Stripe live mode: payments after legal, refund, tax, and reconciliation review.

## Deployment

Deploy the client and server separately. Configure these values in the hosting dashboard, not in source control:

- `MONGO_URI`
- `JWT_SECRET`
- `CLIENT_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- media, email, SMS, and shipping provider credentials

Use a real HTTPS domain for `CLIENT_URL`, configure the Stripe webhook to that HTTPS API URL, and restrict CORS to that exact frontend origin. Enable database backups, error monitoring, uptime checks, log retention, and alerting before accepting live orders.

## Launch gates

- Legal pages reviewed for the operating country.
- Refund, cancellation, privacy, terms, and seller agreements approved.
- Payment reconciliation tested against the payment dashboard.
- Webhook retries are idempotent.
- Stock reservation and release tested under concurrent checkout.
- Backup restore has been rehearsed.
- Staging and production environments use separate credentials.
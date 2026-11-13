This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Rental payments (PayHere sandbox)

Payments are implemented in the Next.js App Router API used by the frontend. The separate Express backend is not used for checkout or webhook processing. Live checkout is not enabled.

For local development and university presentations, the provider defaults to `mock`. The custom demo checkout lets you simulate success, failure, or cancellation. A successful simulation records the payment amount on the booking and payment history, updating the owner dashboard and admin income total. It does not contact a bank or charge real money. Use test accounts and a development database for presentations. To override the default explicitly, set `PAYMENT_PROVIDER=mock` in `frontend/.env.local` and restart the frontend.

To use PayHere Sandbox instead, set `PAYMENT_PROVIDER=payhere` and configure the sandbox credentials and URLs below. Production defaults to PayHere and does not enable mock payments unless the provider is explicitly set to `mock`.

Copy the placeholders in `.env.payment.example` into `frontend/.env.local` and replace them with the sandbox merchant ID and domain-specific merchant secret from PayHere. Keep these values server-side; do not use `NEXT_PUBLIC_` variables. `PAYMENT_SITE_URL` and `PAYHERE_NOTIFY_URL` must be publicly reachable HTTPS URLs for PayHere to send its server notification. PayHere cannot deliver notifications to localhost. During local development, use a secure public tunnel and configure that public host with PayHere. Do not commit `.env.local`.

The company PayHere merchant account receives payments. The company is responsible for paying listing owners manually; this integration does not split payments, transfer owner payouts, hold money in escrow, or automate refunds. No platform service fee is added.

In mock mode, the owner dashboard and admin income totals include successful simulated payments; these are demo values, not real money. In PayHere mode, they count only amounts confirmed by PayHere's signed server notification. Admin dashboard data refreshes when the page regains focus and every 30 seconds.

Rental days are whole UTC calendar-day intervals with the end date exclusive: the last date shown in the booking picker is not charged. At least one chargeable day is required. Rental prices are snapshotted in integer LKR cents when the booking is created. Existing bookings without a snapshot remain unpaid and cannot be paid online; their original prices are not inferred.

The reservation deposit defaults to 30% and can be changed with server-only `RESERVATION_DEPOSIT_PERCENT` (integer 1–99). The configured percentage and calculated amounts are saved on each new booking. The deposit is an advance rental payment, not a refundable damage/security deposit.

Start the sandbox with `npm run dev` in `frontend`, expose the callback route through a public test URL, then run `npm test` and `npm run lint`. PayHere sends `application/x-www-form-urlencoded` notifications. Only the signed server notification updates payment status; the browser return page polls and is not proof of payment.

Use the same public HTTPS host to open the site and receive callbacks; localhost is rejected for checkout. If a payment remains pending because the provider callback is not delivered, checkout stays locked for safety. Reconcile the order in the PayHere sandbox portal before any operational attempt to release it; do not clear the lock based only on a browser redirect.

MongoDB must support transactions (for example MongoDB Atlas or a replica set) for atomic checkout reservation and webhook processing. On deployment, ensure the unique indexes declared by the Booking and Payment schemas are created. Existing documents are not rewritten by a data migration; only new bookings receive snapshots. Reconcile any pre-existing duplicate payment data before creating indexes if this feature has previously been run.

PayHere source documentation: [Checkout API](https://support.payhere.lk/api-&-mobile-sdk/checkout-api). Before production, the company must confirm its merchant account, complete PayHere domain/app approval, configure public HTTPS return/cancel/notification URLs, and explicitly review the provider settings and operational owner-payout process. Production/live processing remains disabled in this code.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

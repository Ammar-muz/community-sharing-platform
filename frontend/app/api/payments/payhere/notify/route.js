import { NextResponse } from "next/server";
import Booking from "@/lib/models/Booking";
import Payment from "@/lib/models/Payment";
import { connectDB } from "@/lib/db";
import paymentUtils from "@/lib/payment-utils.cjs";

export const runtime = "nodejs";

export async function POST(request) {
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
  const merchantId = process.env.PAYHERE_MERCHANT_ID;
  if (process.env.PAYHERE_MODE !== "sandbox" || !merchantSecret || !merchantId) {
    return NextResponse.json({ msg: "PayHere sandbox notification is not configured." }, { status: 503 });
  }

  try {
    const rawBody = await request.text();
    const fields = Object.fromEntries(new URLSearchParams(rawBody));
    if ((fields.status_code === "2" && !fields.payment_id) ||
        !paymentUtils.verifyPayHereNotification(fields, merchantSecret) ||
        fields.merchant_id !== merchantId) {
      return NextResponse.json({ msg: "Invalid provider notification signature or merchant." }, { status: 400 });
    }

    await connectDB();
    const session = await Booking.startSession();
    try {
      await session.withTransaction(async () => {
        const payment = await Payment.findOne({ merchantOrderId: fields.order_id }).session(session);
        if (!payment) throw Object.assign(new Error("Unknown merchant order."), { status: 404 });
        const booking = await Booking.findById(payment.booking).session(session);
        if (!booking) throw Object.assign(new Error("Payment booking not found."), { status: 404 });
        let transition;
        try {
          transition = paymentUtils.applyPayHereNotification(payment, booking, fields);
        } catch (error) {
          if (!error.status) error.status = 409;
          throw error;
        }
        if (transition.unchanged) return;

        payment.status = transition.paymentStatus;
        payment.providerStatusCode = transition.providerStatusCode;
        if (transition.paymentStatus !== "pending" &&
            booking.activePaymentAttempt?.toString() === payment._id.toString()) {
          booking.activePaymentAttempt = null;
        }
        if (transition.providerTransactionRef) {
          payment.providerTransactionRef = transition.providerTransactionRef;
          payment.paidAt = transition.paidAt;
          booking.amountPaidMinor = transition.amountPaidMinor;
          booking.remainingBalanceMinor = transition.remainingBalanceMinor;
          booking.paymentStatus = transition.bookingPaymentStatus;
        }
        await Promise.all([booking.save({ session }), payment.save({ session })]);
      });
    } finally {
      await session.endSession();
    }
    return new Response("OK", { status: 200 });
  } catch (error) {
    if (error.status) return NextResponse.json({ msg: error.message }, { status: error.status });
    console.error("PayHere notification processing error:", error);
    return NextResponse.json({ msg: "Notification could not be processed." }, { status: 500 });
  }
}

import Booking from "@/lib/models/Booking";
import Payment from "@/lib/models/Payment";
import { connectDB } from "@/lib/db";
import { verifyAuth, jsonError } from "@/lib/auth";
import paymentUtils from "@/lib/payment-utils.cjs";

export async function POST(request) {
  if (paymentUtils.getPaymentProvider(process.env.PAYMENT_PROVIDER) !== "mock") {
    return Response.json({ msg: "Mock checkout is not enabled." }, { status: 404 });
  }

  try {
    await connectDB();
    const auth = verifyAuth(request);
    if (auth.error) return jsonError(auth.error);
    const { orderId, result } = await request.json();
    if (typeof orderId !== "string" || orderId.length > 128) {
      return Response.json({ msg: "A valid mock payment reference is required." }, { status: 400 });
    }

    const payment = await Payment.findOne({ merchantOrderId: orderId, provider: "mock" });
    if (!payment) {
      return Response.json({ msg: "Mock payment not found." }, { status: 404 });
    }
    if (payment.renter.toString() !== auth.user.id) {
      return Response.json({ msg: "Only the renter can complete this mock payment." }, { status: 403 });
    }
    const booking = await Booking.findById(payment.booking);
    if (!booking) {
      return Response.json({ msg: "Payment booking not found." }, { status: 404 });
    }

    if (result !== "success") {
      const transition = paymentUtils.applyMockPaymentResult(payment, booking, result);
      if (transition.unchanged) return Response.json({ status: payment.status });
      const updatedPayment = await Payment.findOneAndUpdate(
        { _id: payment._id, status: "pending" },
        { $set: {
          status: transition.paymentStatus,
          providerStatusCode: transition.providerStatusCode
        } },
        { new: true }
      );
      if (!updatedPayment) {
        return Response.json({ msg: "This payment attempt has already finished." }, { status: 409 });
      }
      await Booking.updateOne(
        { _id: booking._id, activePaymentAttempt: payment._id },
        { $unset: { activePaymentAttempt: 1 } }
      );
      return Response.json({ status: updatedPayment.status });
    }

    const totalAmountMinor = booking.totalAmountMinor;
    if (!Number.isSafeInteger(totalAmountMinor) ||
        !Number.isSafeInteger(booking.amountPaidMinor) ||
        !Number.isSafeInteger(booking.remainingBalanceMinor)) {
      return Response.json({ msg: "This booking has no valid saved payment balance." }, { status: 409 });
    }

    const expectedPriorAmountMinor = payment.purpose === "remaining_balance"
      ? totalAmountMinor - payment.expectedAmountMinor
      : 0;
    const nextAmountPaidMinor = expectedPriorAmountMinor + payment.expectedAmountMinor;
    const nextRemainingBalanceMinor = totalAmountMinor - nextAmountPaidMinor;
    if (nextAmountPaidMinor > totalAmountMinor ||
        (payment.purpose === "full" && payment.expectedAmountMinor !== totalAmountMinor) ||
        (payment.purpose === "deposit" && payment.expectedAmountMinor !== booking.depositAmountMinor) ||
        (payment.purpose === "remaining_balance" && payment.expectedAmountMinor < 1)) {
      return Response.json({ msg: "Payment amount no longer matches the booking balance." }, { status: 409 });
    }

    if (payment.status === "pending") {
      if (booking.activePaymentAttempt?.toString() !== payment._id.toString()) {
        return Response.json({ msg: "This checkout is no longer active. Refresh your bookings and try again." }, { status: 409 });
      }
      const transition = paymentUtils.applyMockPaymentResult(payment, booking, result);
      const completedPayment = await Payment.findOneAndUpdate(
        { _id: payment._id, status: "pending" },
        { $set: {
          status: "successful",
          providerStatusCode: transition.providerStatusCode,
          providerTransactionRef: transition.providerTransactionRef,
          paidAt: transition.paidAt
        } },
        { new: true }
      );
      if (!completedPayment) {
        const latestPayment = await Payment.findById(payment._id).select("status").lean();
        if (latestPayment?.status !== "successful") {
          return Response.json({ msg: "This payment attempt has already finished." }, { status: 409 });
        }
      }
    } else if (payment.status !== "successful") {
      return Response.json({ msg: "This payment attempt has already finished." }, { status: 409 });
    } else if (booking.amountPaidMinor !== nextAmountPaidMinor &&
               booking.activePaymentAttempt?.toString() !== payment._id.toString()) {
      return Response.json({ msg: "This payment is successful, but its booking update needs administrator attention." }, { status: 409 });
    }

    const settledBooking = await Booking.updateOne(
      {
        _id: booking._id,
        activePaymentAttempt: payment._id,
        amountPaidMinor: expectedPriorAmountMinor
      },
      {
        $set: {
          amountPaidMinor: nextAmountPaidMinor,
          remainingBalanceMinor: nextRemainingBalanceMinor,
          paymentStatus: nextRemainingBalanceMinor === 0 ? "paid" : "partially_paid"
        },
        $unset: { activePaymentAttempt: 1 }
      }
    );
    if (settledBooking.modifiedCount !== 1) {
      const latestBooking = await Booking.findById(booking._id).select(
        "amountPaidMinor remainingBalanceMinor paymentStatus"
      ).lean();
      const alreadyApplied = latestBooking?.amountPaidMinor === nextAmountPaidMinor &&
        latestBooking?.remainingBalanceMinor === nextRemainingBalanceMinor;
      if (!alreadyApplied) {
        console.error("Mock payment marked successful but booking balance could not be updated:", {
          paymentId: payment._id.toString(),
          bookingId: booking._id.toString()
        });
        return Response.json({ msg: "Payment was recorded, but the booking balance could not be refreshed. Retry or contact the administrator." }, { status: 409 });
      }
    }
    return Response.json({ status: "successful" });
  } catch (error) {
    if (error.status) return Response.json({ msg: error.message }, { status: error.status });
    console.error("Mock payment completion error:", error);
    return jsonError({});
  }
}

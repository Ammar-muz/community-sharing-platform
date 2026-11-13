import mongoose from "mongoose";
import Payment from "@/lib/models/Payment";
import Booking from "@/lib/models/Booking";
import { connectDB } from "@/lib/db";
import { verifyAuth, jsonError } from "@/lib/auth";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const auth = verifyAuth(request);
    if (auth.error) return jsonError(auth.error);
    const { id } = await params;
    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { merchantOrderId: id }] }
      : { merchantOrderId: id };
    const payment = await Payment.findOne(query).lean();
    if (!payment) return Response.json({ msg: "Payment not found." }, { status: 404 });

    const booking = await Booking.findById(payment.booking).select("renter owner").lean();
    if (!booking ||
        (booking.renter.toString() !== auth.user.id &&
         booking.owner.toString() !== auth.user.id &&
         auth.user.role !== "admin")) {
      return Response.json({ msg: "You cannot view this payment." }, { status: 403 });
    }

    return Response.json({
      id: payment._id,
      merchantOrderId: payment.merchantOrderId,
      provider: payment.provider,
      purpose: payment.purpose,
      amountMinor: payment.expectedAmountMinor,
      currency: payment.currency,
      status: payment.status,
      providerTransactionRef: payment.providerTransactionRef || null,
      paidAt: payment.paidAt || null,
      bookingId: payment.booking
    });
  } catch (error) {
    console.error("Get payment status error:", error);
    return jsonError({});
  }
}

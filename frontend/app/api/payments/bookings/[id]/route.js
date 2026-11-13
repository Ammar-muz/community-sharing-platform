import mongoose from "mongoose";
import Booking from "@/lib/models/Booking";
import Payment from "@/lib/models/Payment";
import User from "@/lib/models/User";
import { connectDB } from "@/lib/db";
import { verifyAuth, jsonError } from "@/lib/auth";
import paymentUtils from "@/lib/payment-utils.cjs";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const auth = verifyAuth(request);
    if (auth.error) return jsonError(auth.error);
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return Response.json({ msg: "Booking not found." }, { status: 404 });
    }
    const booking = await Booking.findById(id).populate("item", "title");
    if (!booking) return Response.json({ msg: "Booking not found." }, { status: 404 });

    const isRenter = booking.renter.toString() === auth.user.id;
    const isOwner = booking.owner.toString() === auth.user.id;
    const isAdmin = auth.user.role === "admin" &&
      Boolean(await User.exists({ _id: auth.user.id, role: "admin" }));
    if (!isRenter && !isOwner && !isAdmin) {
      return Response.json({ msg: "You cannot view this booking's payment details." }, { status: 403 });
    }

    const payments = await Payment.find({ booking: booking._id }).sort({ createdAt: -1 }).lean();
    const checkoutProvider = paymentUtils.getPaymentProvider(process.env.PAYMENT_PROVIDER);
    const checkoutConfigurationError = paymentUtils.paymentProviderConfigurationError({
      provider: checkoutProvider,
      mode: process.env.PAYHERE_MODE,
      merchantId: process.env.PAYHERE_MERCHANT_ID,
      merchantSecret: process.env.PAYHERE_MERCHANT_SECRET,
      siteUrl: process.env.PAYMENT_SITE_URL,
      notifyUrl: process.env.PAYHERE_NOTIFY_URL
    });
    return Response.json({
      checkoutProvider,
      checkoutConfigurationError,
      booking: {
        id: booking._id,
        item: booking.item,
        renter: booking.renter,
        owner: booking.owner,
        startDate: booking.startDate,
        endDate: booking.endDate,
        status: booking.status,
        currency: booking.currency || null,
        dailyPriceMinor: booking.dailyPriceMinor ?? null,
        chargeableDays: booking.chargeableDays ?? null,
        totalAmountMinor: booking.totalAmountMinor ?? null,
        depositPercent: booking.depositPercent ?? null,
        depositAmountMinor: booking.depositAmountMinor ?? null,
        amountPaidMinor: booking.amountPaidMinor ?? null,
        remainingBalanceMinor: booking.remainingBalanceMinor ?? null,
        paymentStatus: booking.paymentStatus || "unpaid"
      },
      payments: payments.map(payment => ({
        id: payment._id,
        purpose: payment.purpose,
        provider: payment.provider,
        merchantOrderId: payment.merchantOrderId,
        providerTransactionRef: payment.providerTransactionRef || null,
        expectedAmountMinor: payment.expectedAmountMinor,
        currency: payment.currency,
        status: payment.status,
        createdAt: payment.createdAt,
        paidAt: payment.paidAt || null
      }))
    });
  } catch (error) {
    console.error("Get payment summary error:", error);
    return jsonError({});
  }
}

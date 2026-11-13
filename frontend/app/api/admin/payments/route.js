import Payment from "@/lib/models/Payment";
import User from "@/lib/models/User";
import "@/lib/models/Booking";
import "@/lib/models/User";
import { connectDB } from "@/lib/db";
import { verifyAuth, requireAdmin, jsonError } from "@/lib/auth";
import paymentUtils from "@/lib/payment-utils.cjs";

export async function GET(request) {
  try {
    await connectDB();
    const auth = verifyAuth(request);
    if (auth.error) return jsonError(auth.error);
    const denied = requireAdmin(auth.user);
    if (denied) return jsonError(denied, denied.status);
    const currentAdmin = await User.exists({ _id: auth.user.id, role: "admin" });
    if (!currentAdmin) {
      return Response.json({ msg: "Access denied. Admins only." }, { status: 403 });
    }

    const payments = await Payment.find()
      .populate({
        path: "booking",
        select: "item owner startDate endDate",
        populate: [
          { path: "item", select: "title" },
          { path: "owner", select: "name email" }
        ]
      })
      .populate("renter", "name email")
      .sort({ createdAt: -1 })
      .lean();
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
      payments: payments.map(payment => ({
        id: payment._id,
        bookingId: payment.booking?._id,
        listing: payment.booking?.item?.title || "Listing unavailable",
        renter: payment.renter ? { name: payment.renter.name, email: payment.renter.email } : null,
        owner: payment.booking?.owner ? { name: payment.booking.owner.name, email: payment.booking.owner.email } : null,
        purpose: payment.purpose,
        amountMinor: payment.expectedAmountMinor,
        currency: payment.currency,
        status: payment.status,
        provider: payment.provider,
        providerReference: payment.providerTransactionRef || null,
        createdAt: payment.createdAt,
        paidAt: payment.paidAt || null
      }))
    });
  } catch (error) {
    console.error("Admin payments error:", error);
    return jsonError({});
  }
}

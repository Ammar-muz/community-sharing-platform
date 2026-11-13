import crypto from "node:crypto";
import mongoose from "mongoose";
import Booking from "@/lib/models/Booking";
import Payment from "@/lib/models/Payment";
import User from "@/lib/models/User";
import { connectDB } from "@/lib/db";
import { verifyAuth, jsonError } from "@/lib/auth";
import paymentUtils from "@/lib/payment-utils.cjs";

const CHECKOUT_URL = "https://sandbox.payhere.lk/pay/checkout";

async function reserveCheckout({ bookingId, userId, purpose, provider, suppliedPhone, suppliedCity, session }) {
  const sessionOptions = session ? { session } : {};
  const bookingQuery = Booking.findById(bookingId);
  if (session) bookingQuery.session(session);
  const booking = await bookingQuery;
  if (!booking) throw Object.assign(new Error("Booking not found."), { status: 404 });
  const amountMinor = paymentUtils.validateCheckout(booking, userId, purpose);

  const renterQuery = User.findById(booking.renter);
  if (session) renterQuery.session(session);
  const renter = await renterQuery;
  const itemQuery = Booking.findById(booking._id).populate("item", "title");
  if (session) itemQuery.session(session);
  const populatedBooking = await itemQuery;
  if (!renter) throw Object.assign(new Error("Renter account not found."), { status: 404 });
  const checkoutPhone = suppliedPhone || renter.phone;
  const checkoutCity = suppliedCity || renter.location;
  if (provider === "payhere" &&
      (!checkoutPhone || !/^\+?[0-9][0-9\s-]{7,14}$/.test(checkoutPhone) ||
       !checkoutCity || checkoutCity.length > 100)) {
    throw Object.assign(new Error("Enter your phone number and city to continue to PayHere."), { status: 400 });
  }

  const pendingQuery = Payment.findOne({ booking: booking._id, status: "pending" });
  if (session) pendingQuery.session(session);
  if (await pendingQuery) {
    throw Object.assign(new Error("A checkout is already in progress for this booking. Complete it or wait for its result."), { status: 409 });
  }

  const merchantOrderId = `CS-${crypto.randomUUID()}`;
  const payment = new Payment({
    booking: booking._id,
    renter: booking.renter,
    purpose,
    provider,
    merchantOrderId,
    expectedAmountMinor: amountMinor,
    currency: booking.currency
  });
  await payment.save(sessionOptions);

  const lockQuery = {
    _id: booking._id,
    status: { $in: ["accepted", "confirmed"] },
    $and: [
      { $or: [{ activePaymentAttempt: { $exists: false } }, { activePaymentAttempt: null }] },
      { amountPaidMinor: booking.amountPaidMinor },
      { remainingBalanceMinor: booking.remainingBalanceMinor }
    ]
  };
  const lock = await Booking.updateOne(
    lockQuery,
    { $set: { activePaymentAttempt: payment._id } },
    sessionOptions
  );
  if (lock.modifiedCount !== 1) {
    if (!session) {
      await Payment.updateOne(
        { _id: payment._id, status: "pending" },
        { $set: { status: "cancelled", providerStatusCode: "MOCK_RESERVATION_FAILED" } }
      );
    }
    throw Object.assign(new Error("A checkout is already in progress or this booking has changed. Refresh and try again."), { status: 409 });
  }

  return {
    payment: payment.toObject(),
    customer: { ...renter.toObject(), phone: checkoutPhone, location: checkoutCity },
    itemTitle: populatedBooking.item?.title || "CommunityShare rental"
  };
}

export async function POST(request) {
  try {
    const provider = paymentUtils.getPaymentProvider(process.env.PAYMENT_PROVIDER);
    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    const siteUrl = process.env.PAYMENT_SITE_URL;
    const notifyUrl = process.env.PAYHERE_NOTIFY_URL;
    const configurationError = paymentUtils.paymentProviderConfigurationError({
      provider,
      mode: process.env.PAYHERE_MODE,
      merchantId,
      merchantSecret,
      siteUrl,
      notifyUrl
    });
    if (configurationError) {
      return Response.json({ msg: configurationError }, { status: 503 });
    }
    const site = provider === "payhere" ? new URL(siteUrl) : null;

    await connectDB();
    const auth = verifyAuth(request);
    if (auth.error) return jsonError(auth.error);
    const body = await request.json();
    const { bookingId, purpose } = body;
    if (!["full", "deposit", "remaining_balance"].includes(purpose)) {
      return Response.json({ msg: "Choose full payment, deposit, or remaining balance." }, { status: 400 });
    }
    if (!mongoose.isValidObjectId(bookingId)) {
      return Response.json({ msg: "A valid booking reference is required." }, { status: 400 });
    }
    const suppliedPhone = typeof body.phone === "string" ? body.phone.trim() : "";
    const suppliedCity = typeof body.city === "string" ? body.city.trim() : "";
    if (suppliedPhone && !/^\+?[0-9][0-9\s-]{7,14}$/.test(suppliedPhone)) {
      return Response.json({ msg: "Enter a valid phone number for the PayHere checkout." }, { status: 400 });
    }

    let checkout;
    if (provider === "mock") {
      checkout = await reserveCheckout({
        bookingId, userId: auth.user.id, purpose, provider, suppliedPhone, suppliedCity
      });
    } else {
      const session = await Booking.startSession();
      try {
        await session.withTransaction(async () => {
          checkout = await reserveCheckout({
            bookingId, userId: auth.user.id, purpose, provider, suppliedPhone, suppliedCity, session
          });
        });
      } finally {
        await session.endSession();
      }
    }

    const { payment: createdPayment, customer, itemTitle } = checkout;
    const orderId = createdPayment.merchantOrderId;
    if (provider === "mock") {
      return Response.json({
        redirectUrl: `/payments/mock?order=${encodeURIComponent(orderId)}`
      });
    }

    const amount = paymentUtils.minorToDecimal(createdPayment.expectedAmountMinor);
    const fields = {
      merchant_id: merchantId,
      return_url: `${site.toString().replace(/\/+$/, "")}/payments/result?order=${encodeURIComponent(orderId)}&booking=${createdPayment.booking}`,
      cancel_url: `${site.toString().replace(/\/+$/, "")}/payments/result?order=${encodeURIComponent(orderId)}&booking=${createdPayment.booking}&cancelled=1`,
      notify_url: notifyUrl,
      first_name: customer.name.split(/\s+/)[0],
      last_name: customer.name.split(/\s+/).slice(1).join(" ") || customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.location,
      city: customer.location,
      country: "Sri Lanka",
      order_id: orderId,
      items: `${itemTitle} - ${createdPayment.purpose.replaceAll("_", " ")}`,
      currency: createdPayment.currency,
      amount,
      hash: paymentUtils.createPayHereHash(merchantId, orderId, amount, createdPayment.currency, merchantSecret)
    };

    return Response.json({ checkoutUrl: CHECKOUT_URL, fields });
  } catch (error) {
    if (error.code === 11000) {
      return Response.json({ msg: "A checkout is already in progress for this booking." }, { status: 409 });
    }
    if (error.status) {
      return Response.json({ msg: error.message }, { status: error.status });
    }
    console.error("Start payment checkout error:", error);
    return jsonError({});
  }
}

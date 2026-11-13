import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  renter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalPrice: { type: Number },
  currency: { type: String, enum: ["LKR"] },
  dailyPriceMinor: { type: Number, min: 0 },
  chargeableDays: { type: Number, min: 1 },
  totalAmountMinor: { type: Number, min: 0 },
  depositPercent: { type: Number, min: 1, max: 99 },
  depositAmountMinor: { type: Number, min: 0 },
  amountPaidMinor: { type: Number, min: 0 },
  remainingBalanceMinor: { type: Number, min: 0 },
  activePaymentAttempt: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
  paymentStatus: {
    type: String,
    enum: ["unpaid", "partially_paid", "paid"],
    default: "unpaid"
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "confirmed", "rejected", "cancelled", "completed"],
    default: "pending"
  },
  createdAt: { type: Date, default: Date.now }
});

bookingSchema.index({ renter: 1, createdAt: -1 });
bookingSchema.index({ owner: 1, createdAt: -1 });

export default mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
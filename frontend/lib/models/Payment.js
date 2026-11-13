import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
  renter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  purpose: {
    type: String,
    enum: ["full", "deposit", "remaining_balance"],
    required: true
  },
  provider: { type: String, enum: ["payhere", "mock"], required: true },
  merchantOrderId: { type: String, required: true, unique: true },
  providerTransactionRef: { type: String, sparse: true, unique: true },
  expectedAmountMinor: { type: Number, required: true, min: 1 },
  currency: { type: String, enum: ["LKR"], required: true },
  status: {
    type: String,
    enum: ["pending", "successful", "failed", "cancelled", "expired"],
    default: "pending",
    required: true
  },
  providerStatusCode: { type: String },
  paidAt: { type: Date }
}, { timestamps: true });

paymentSchema.index(
  { booking: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);
paymentSchema.index({ booking: 1, createdAt: -1 });

export default mongoose.models.Payment || mongoose.model("Payment", paymentSchema);

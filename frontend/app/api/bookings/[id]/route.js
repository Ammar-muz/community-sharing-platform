import Booking from "@/lib/models/Booking";
import Payment from "@/lib/models/Payment";
import { connectDB } from "@/lib/db";
import { verifyAuth, jsonError } from "@/lib/auth";

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const auth = verifyAuth(request);
    if (auth.error) return jsonError(auth.error);

    const { id } = await params;
    const { status } = await request.json();
    const booking = await Booking.findById(id);
    if (!booking) return Response.json({ msg: "Booking not found." }, { status: 404 });
    const renter = booking.renter.toString() === auth.user.id;
    const owner = booking.owner.toString() === auth.user.id;

    if (owner && booking.status === "pending" && ["accepted", "confirmed", "rejected"].includes(status)) {
      booking.status = status;
    } else if (renter && ["pending", "accepted", "confirmed"].includes(booking.status) && status === "cancelled") {
      const [successfulPayment, pendingPayment] = await Promise.all([
        Payment.exists({ booking: id, status: "successful" }),
        Payment.exists({ booking: id, status: "pending" })
      ]);
      if (successfulPayment || booking.paymentStatus === "partially_paid" || booking.paymentStatus === "paid") {
        return Response.json({
          msg: "This booking has a successful payment. Contact support for cancellation; automatic refunds are not available."
        }, { status: 409 });
      }
      if (pendingPayment) {
        return Response.json({ msg: "A payment checkout is in progress. Wait for its result before cancelling." }, { status: 409 });
      }
      booking.status = "cancelled";
    } else {
      return Response.json({ msg: "This status change is not permitted." }, { status: 403 });
    }
    await booking.save();
    return Response.json(booking);
  } catch (err) {
    console.log("Update booking error:", err);
    return jsonError(err);
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const auth = verifyAuth(request);
    if (auth.error) return jsonError(auth.error);

    const { id } = await params;
    const booking = await Booking.findById(id);
    if (!booking) return Response.json({ msg: "Booking not found." }, { status: 404 });
    const isRenter = booking.renter.toString() === auth.user.id;
    const isOwner = booking.owner.toString() === auth.user.id;
    const isAdmin = auth.user.role === "admin";
    if (!isRenter && !isOwner && !isAdmin) {
      return Response.json({ msg: "You cannot delete this booking." }, { status: 403 });
    }
    if (await Payment.exists({ booking: id, status: { $in: ["pending", "successful"] } })) {
      return Response.json({
        msg: "Bookings with a pending or successful payment cannot be deleted. Contact support for cancellation; automatic refunds are not available."
      }, { status: 409 });
    }
    await Booking.findByIdAndDelete(id);
    return Response.json({ msg: "Booking deleted" });
  } catch (err) {
    console.log("Delete booking error:", err);
    return jsonError(err);
  }
}
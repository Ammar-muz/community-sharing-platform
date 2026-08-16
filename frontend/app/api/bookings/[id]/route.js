import Booking from "@/lib/models/Booking";
import { connectDB } from "@/lib/db";
import { verifyAuth, jsonError } from "@/lib/auth";

export async function PUT(request, { params }) {
  await connectDB();
  try {
    const auth = verifyAuth(request);
    if (auth.error) return jsonError(auth.error);

    const { id } = await params;
    const { status } = await request.json();
    const booking = await Booking.findByIdAndUpdate(id, { status }, { new: true });
    return Response.json(booking);
  } catch (err) {
    console.log("Update booking error:", err);
    return jsonError({});
  }
}

export async function DELETE(request, { params }) {
  await connectDB();
  try {
    const auth = verifyAuth(request);
    if (auth.error) return jsonError(auth.error);

    const { id } = await params;
    await Booking.findByIdAndDelete(id);
    return Response.json({ msg: "Booking deleted" });
  } catch (err) {
    console.log("Delete booking error:", err);
    return jsonError({});
  }
}
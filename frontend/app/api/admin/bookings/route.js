import Booking from "@/lib/models/Booking";
import { connectDB } from "@/lib/db";
import { verifyAuth, requireAdmin, jsonError } from "@/lib/auth";

export async function GET(request) {
  await connectDB();
  try {
    const auth = verifyAuth(request);
    if (auth.error) return jsonError(auth.error);
    const denied = requireAdmin(auth.user);
    if (denied) return jsonError(denied, denied.status);

    const bookings = await Booking.find()
      .populate("item", "title pricePerDay category images")
      .populate("renter", "name email")
      .populate("owner", "name email");
    return Response.json(bookings);
  } catch (err) {
    console.log("Admin bookings error:", err);
    return jsonError({});
  }
}
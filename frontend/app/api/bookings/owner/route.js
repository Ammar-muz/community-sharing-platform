import Booking from "@/lib/models/Booking";
import { connectDB } from "@/lib/db";
import { verifyAuth, jsonError } from "@/lib/auth";

export async function GET(request) {
  await connectDB();
  try {
    const auth = verifyAuth(request);
    if (auth.error) return jsonError(auth.error);

    const bookings = await Booking.find({ owner: auth.user.id })
      .populate("item", "title pricePerDay images category")
      .populate("renter", "name email phone");
    return Response.json(bookings);
  } catch (err) {
    console.log("Get owner bookings error:", err);
    return jsonError({});
  }
}
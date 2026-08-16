import Booking from "@/lib/models/Booking";
import { connectDB } from "@/lib/db";
import { verifyAuth, jsonError } from "@/lib/auth";

export async function GET(request) {
  await connectDB();
  try {
    const auth = verifyAuth(request);
    if (auth.error) return jsonError(auth.error);

    const bookings = await Booking.find({ renter: auth.user.id })
      .populate("item", "title pricePerDay images category")
      .populate("owner", "name email");
    return Response.json(bookings);
  } catch (err) {
    console.log("Get my bookings error:", err);
    return jsonError({});
  }
}
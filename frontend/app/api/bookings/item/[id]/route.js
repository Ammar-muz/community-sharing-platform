import Booking from "@/lib/models/Booking";
import { connectDB } from "@/lib/db";
import { jsonError } from "@/lib/auth";

export async function GET(request, { params }) {
  await connectDB();
  try {
    const { id } = await params;
    const bookings = await Booking.find({ item: id })
      .select("startDate endDate status");
    return Response.json(bookings);
  } catch (err) {
    console.log("Get item bookings error:", err);
    return jsonError({});
  }
}
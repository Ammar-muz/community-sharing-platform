import Booking from "@/lib/models/Booking";
import Item from "@/lib/models/Item";
import { connectDB } from "@/lib/db";
import { verifyAuth, jsonError } from "@/lib/auth";

export async function POST(request) {
  await connectDB();
  try {
    const auth = verifyAuth(request);
    if (auth.error) return jsonError(auth.error);

    const { itemId, startDate, endDate } = await request.json();

    const item = await Item.findById(itemId);
    if (!item) return Response.json({ msg: "Item not found" }, { status: 404 });

    const days = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
    const totalPrice = days * item.pricePerDay;

    const booking = new Booking({
      item: itemId,
      renter: auth.user.id,
      owner: item.owner,
      startDate,
      endDate,
      totalPrice
    });

    await booking.save();
    return Response.json(booking);
  } catch (err) {
    console.log("Create booking error:", err);
    return jsonError({});
  }
}
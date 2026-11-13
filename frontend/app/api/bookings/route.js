import Booking from "@/lib/models/Booking";
import Item from "@/lib/models/Item";
import { connectDB } from "@/lib/db";
import { verifyAuth, jsonError } from "@/lib/auth";
import paymentUtils from "@/lib/payment-utils.cjs";

export async function POST(request) {
  try {
    await connectDB();
    const auth = verifyAuth(request);
    if (auth.error) return jsonError(auth.error);

    const { itemId, startDate, endDate } = await request.json();
    if (!/^[a-f\d]{24}$/i.test(itemId || "")) {
      return Response.json({ msg: "A valid listing is required." }, { status: 400 });
    }

    const item = await Item.findById(itemId);
    if (!item) return Response.json({ msg: "Item not found" }, { status: 404 });

    const days = paymentUtils.parseRentalDays(startDate, endDate);
    const configuredDeposit = process.env.RESERVATION_DEPOSIT_PERCENT || "30";
    if (!/^\d{1,2}$/.test(configuredDeposit)) {
      throw new Error("RESERVATION_DEPOSIT_PERCENT must be an integer from 1 to 99.");
    }
    const priceSnapshot = paymentUtils.createPriceSnapshot(
      item.pricePerDay,
      days,
      Number(configuredDeposit)
    );

    const booking = new Booking({
      item: itemId,
      renter: auth.user.id,
      owner: item.owner,
      startDate: new Date(`${startDate}T00:00:00.000Z`),
      endDate: new Date(`${endDate}T00:00:00.000Z`),
      totalPrice: priceSnapshot.totalAmountMinor / 100,
      ...priceSnapshot
    });

    await booking.save();
    return Response.json(booking);
  } catch (err) {
    if (err.message?.includes("rental dates") ||
        err.message?.includes("chargeable rental day") ||
        err.message?.includes("listing price") ||
        err.message?.includes("deposit percentage")) {
      return Response.json({ msg: err.message }, { status: 400 });
    }
    console.log("Create booking error:", err);
    return jsonError({});
  }
}
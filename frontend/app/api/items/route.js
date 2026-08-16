import Item from "@/lib/models/Item";
import { connectDB } from "@/lib/db";
import { verifyAuth, jsonError } from "@/lib/auth";

export async function GET(request) {
  await connectDB();
  try {
    const { searchParams } = request.nextUrl;
    const location = searchParams.get("location");
    const category = searchParams.get("category");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    let query = {};
    if (location) query.location = { $regex: location, $options: "i" };
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.pricePerDay = {};
      if (minPrice) query.pricePerDay.$gte = Number(minPrice);
      if (maxPrice) query.pricePerDay.$lte = Number(maxPrice);
    }

    const items = await Item.find(query).populate("owner", "name email");
    return Response.json(items);
  } catch (err) {
    console.log("Get items error:", err);
    return jsonError({});
  }
}

export async function POST(request) {
  await connectDB();
  try {
    const auth = verifyAuth(request);
    if (auth.error) return jsonError(auth.error);

    const body = await request.json();
    const item = new Item({ ...body, owner: auth.user.id });
    await item.save();
    return Response.json(item);
  } catch (err) {
    console.log("Create item error:", err);
    return jsonError({});
  }
}
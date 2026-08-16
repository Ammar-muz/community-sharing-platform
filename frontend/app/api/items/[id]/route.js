import Item from "@/lib/models/Item";
import { connectDB } from "@/lib/db";
import { verifyAuth, jsonError } from "@/lib/auth";

export async function GET(request, { params }) {
  await connectDB();
  try {
    const { id } = await params;
    const item = await Item.findById(id).populate("owner", "name email");
    if (!item) return Response.json({ msg: "Item not found" }, { status: 404 });
    return Response.json(item);
  } catch (err) {
    console.log("Get item error:", err);
    return jsonError({});
  }
}

export async function PUT(request, { params }) {
  await connectDB();
  try {
    const auth = verifyAuth(request);
    if (auth.error) return jsonError(auth.error);

    const { id } = await params;
    const body = await request.json();
    const item = await Item.findByIdAndUpdate(id, body, { new: true });
    return Response.json(item);
  } catch (err) {
    console.log("Update item error:", err);
    return jsonError({});
  }
}

export async function DELETE(request, { params }) {
  await connectDB();
  try {
    const auth = verifyAuth(request);
    if (auth.error) return jsonError(auth.error);

    const { id } = await params;
    await Item.findByIdAndDelete(id);
    return Response.json({ msg: "Item deleted" });
  } catch (err) {
    console.log("Delete item error:", err);
    return jsonError({});
  }
}
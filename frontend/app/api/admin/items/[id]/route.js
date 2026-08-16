import Item from "@/lib/models/Item";
import { connectDB } from "@/lib/db";
import { verifyAuth, requireAdmin, jsonError } from "@/lib/auth";

export async function DELETE(request, { params }) {
  await connectDB();
  try {
    const auth = verifyAuth(request);
    if (auth.error) return jsonError(auth.error);
    const denied = requireAdmin(auth.user);
    if (denied) return jsonError(denied, denied.status);

    const { id } = await params;
    await Item.findByIdAndDelete(id);
    return Response.json({ msg: "Item deleted" });
  } catch (err) {
    console.log("Admin delete item error:", err);
    return jsonError({});
  }
}
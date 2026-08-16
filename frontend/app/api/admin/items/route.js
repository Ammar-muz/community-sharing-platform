import Item from "@/lib/models/Item";
import { connectDB } from "@/lib/db";
import { verifyAuth, requireAdmin, jsonError } from "@/lib/auth";

export async function GET(request) {
  await connectDB();
  try {
    const auth = verifyAuth(request);
    if (auth.error) return jsonError(auth.error);
    const denied = requireAdmin(auth.user);
    if (denied) return jsonError(denied, denied.status);

    const items = await Item.find().populate("owner", "name email");
    return Response.json(items);
  } catch (err) {
    console.log("Admin items error:", err);
    return jsonError({});
  }
}
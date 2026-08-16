import User from "@/lib/models/User";
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
    await User.findByIdAndDelete(id);
    return Response.json({ msg: "User deleted" });
  } catch (err) {
    console.log("Admin delete user error:", err);
    return jsonError({});
  }
}
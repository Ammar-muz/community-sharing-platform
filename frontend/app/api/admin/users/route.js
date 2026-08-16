import User from "@/lib/models/User";
import { connectDB } from "@/lib/db";
import { verifyAuth, requireAdmin, jsonError } from "@/lib/auth";

export async function GET(request) {
  await connectDB();
  try {
    const auth = verifyAuth(request);
    if (auth.error) return jsonError(auth.error);
    const denied = requireAdmin(auth.user);
    if (denied) return jsonError(denied, denied.status);

    const users = await User.find().select("-password");
    return Response.json(users);
  } catch (err) {
    console.log("Admin users error:", err);
    return jsonError({});
  }
}
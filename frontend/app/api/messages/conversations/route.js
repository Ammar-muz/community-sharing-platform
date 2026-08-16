import Message from "@/lib/models/Message";
import { connectDB } from "@/lib/db";
import { verifyAuth, jsonError } from "@/lib/auth";

export async function GET(request) {
  await connectDB();
  try {
    const auth = verifyAuth(request);
    if (auth.error) return jsonError(auth.error);

    const messages = await Message.find({
      $or: [{ sender: auth.user.id }, { receiver: auth.user.id }]
    })
      .populate("sender", "name email")
      .populate("receiver", "name email")
      .populate("item", "title images")
      .sort({ createdAt: -1 });
    return Response.json(messages);
  } catch (err) {
    console.log("Conversations error:", err);
    return jsonError({});
  }
}
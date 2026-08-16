import Message from "@/lib/models/Message";
import { connectDB } from "@/lib/db";
import { verifyAuth, jsonError } from "@/lib/auth";

export async function GET(request, { params }) {
  await connectDB();
  try {
    const auth = verifyAuth(request);
    if (auth.error) return jsonError(auth.error);

    const { userId } = await params;
    const messages = await Message.find({
      $or: [
        { sender: auth.user.id, receiver: userId },
        { sender: userId, receiver: auth.user.id }
      ]
    })
      .populate("sender", "name email")
      .populate("receiver", "name email")
      .populate("item", "title images")
      .sort({ createdAt: 1 });

    await Message.updateMany(
      { sender: userId, receiver: auth.user.id, read: false },
      { read: true }
    );
    return Response.json(messages);
  } catch (err) {
    console.log("Get messages error:", err);
    return jsonError({});
  }
}
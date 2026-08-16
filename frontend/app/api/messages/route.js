import Message from "@/lib/models/Message";
import { connectDB } from "@/lib/db";
import { verifyAuth, jsonError } from "@/lib/auth";

export async function POST(request) {
  await connectDB();
  try {
    const auth = verifyAuth(request);
    if (auth.error) return jsonError(auth.error);

    const { receiverId, itemId, message } = await request.json();
    if (!receiverId || !message) {
      return Response.json(
        { msg: "receiverId and message are required" },
        { status: 400 }
      );
    }

    const newMessage = new Message({
      sender: auth.user.id,
      receiver: receiverId,
      item: itemId || null,
      message
    });
    await newMessage.save();

    const populated = await Message.findById(newMessage._id)
      .populate("sender", "name email")
      .populate("receiver", "name email")
      .populate("item", "title");
    return Response.json(populated);
  } catch (err) {
    console.log("Message send error:", err);
    return jsonError({});
  }
}
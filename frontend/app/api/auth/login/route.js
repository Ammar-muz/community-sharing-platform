import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "@/lib/models/User";
import { connectDB } from "@/lib/db";

export async function POST(request) {
  await connectDB();
  try {
    const { email, password } = await request.json();

    const user = await User.findOne({ email });
    if (!user) {
      return Response.json({ msg: "Invalid credentials" }, { status: 400 });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return Response.json({ msg: "Invalid credentials" }, { status: 400 });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    return Response.json({
      token,
      user: { id: user._id, name: user.name, email, role: user.role }
    });
  } catch (err) {
    console.log("Login error:", err);
    return Response.json({ msg: "Server error" }, { status: 500 });
  }
}
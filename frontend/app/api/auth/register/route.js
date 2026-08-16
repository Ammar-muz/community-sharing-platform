import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "@/lib/models/User";
import { connectDB } from "@/lib/db";

export async function POST(request) {
  await connectDB();
  try {
    const { name, email, password, role, location, phone } = await request.json();

    if (!name || !email || !password) {
      return Response.json({ msg: "Name, email and password are required" }, { status: 400 });
    }

    const allowedRoles = ["user", "owner"];
    const finalRole = allowedRoles.includes(role) ? role : "user";

    const exists = await User.findOne({ email });
    if (exists) {
      return Response.json({ msg: "User already exists" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed, role: finalRole, location, phone });
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    return Response.json({
      token,
      user: { id: user._id, name, email, role: user.role }
    });
  } catch (err) {
    console.log("Register error:", err);
    return Response.json({ msg: "Server error" }, { status: 500 });
  }
}
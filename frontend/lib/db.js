import mongoose from "mongoose";
import "./models/User";
import "./models/Item";
import "./models/Booking";
import "./models/Message";

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  return mongoose.connect(process.env.MONGODB_URI);
}
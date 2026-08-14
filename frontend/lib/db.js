import mongoose from "mongoose";

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;

  return mongoose.connect(process.env.mongodb+srv://User123:Ammar126@community-sharing.i4lhyoj.mongodb.net/csplatform?retryWrites=true&w=majority);
}
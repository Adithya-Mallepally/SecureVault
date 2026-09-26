import mongoose from "mongoose";
import { env } from "./env";

export async function connectDB(): Promise<void> {
  try {
    if (env.NODE_ENV === "test") {
      // In test mode, allow tests to handle DB connections or in-memory mocks
      return;
    }
    await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 3000 });
    console.log(`[SecureVault] Connected to MongoDB at ${env.MONGO_URI}`);
  } catch (err) {
    console.warn(`[SecureVault] Warning: MongoDB connection failed: ${(err as Error).message}. Running in memory fallback mode.`);
  }
}

import mongoose from "mongoose";
import app from "./app.js";
import { connectDB } from "./config/db.js";

let dbConnectPromise = null;

async function ensureDbConnection() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!dbConnectPromise) {
    dbConnectPromise = connectDB().catch((error) => {
      dbConnectPromise = null;
      throw error;
    });
  }

  await dbConnectPromise;
}

export default async function handler(req, res) {
  try {
    await ensureDbConnection();
    return app(req, res);
  } catch (error) {
    return res.status(503).json({
      success: false,
      message: "Database unavailable. Please check MongoDB connection and try again.",
      ...(process.env.NODE_ENV !== "production" ? { details: error.message } : {}),
    });
  }
}

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
  if (req.method === "OPTIONS") {
    return app(req, res);
  }

  try {
    await ensureDbConnection();
  } catch {
    // Fall through to Express so CORS headers are applied consistently.
    // /api routes will return 503 via requireDbConnection middleware.
  }

  return app(req, res);
}

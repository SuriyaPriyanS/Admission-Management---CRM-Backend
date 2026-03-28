import mongoose from "mongoose";

export function requireDbConnection(req, res, next) {
  if (req.method === "OPTIONS") {
    return next();
  }

  if (mongoose.connection.readyState === 1) {
    return next();
  }

  return res.status(503).json({
    success: false,
    message: "Database unavailable. Please check MongoDB connection and try again.",
  });
}

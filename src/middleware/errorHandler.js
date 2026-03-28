export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err, req, res, next) {
  const isDbBufferTimeout = typeof err?.message === "string" && err.message.includes("buffering timed out");
  const statusCode = isDbBufferTimeout ? 503 : err.statusCode || 500;
  const message = isDbBufferTimeout
    ? "Database unavailable. Please check MongoDB connection and try again."
    : err.message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
  });
}

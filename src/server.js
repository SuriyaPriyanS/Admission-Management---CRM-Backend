import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

// For serverless environments (Vercel), we need to handle connection differently
const isServerless = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

let isConnected = false;
let connectionPromise = null;

// Middleware to ensure database connection before handling requests
async function ensureDBConnection(req, res, next) {
  if (isConnected) {
    return next();
  }

  // If already connecting, wait for that promise
  if (connectionPromise) {
    try {
      await connectionPromise;
      return next();
    } catch (error) {
      return res.status(503).json({
        success: false,
        message: "Database connection failed. Please try again later.",
      });
    }
  }

  // Start new connection
  connectionPromise = connectDB()
    .then(() => {
      isConnected = true;
      console.log("Database connected successfully");
    })
    .catch((error) => {
      console.error("Database connection failed:", error.message);
      connectionPromise = null;
      throw error;
    });

  try {
    await connectionPromise;
    next();
  } catch (error) {
    return res.status(503).json({
      success: false,
      message: "Database connection failed. Please try again later.",
    });
  }
}

// Apply database connection middleware to all routes
app.use(ensureDBConnection);

// Start server for local development
if (!isServerless) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel serverless functions
export default app;

import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

// For serverless environments (Vercel), we need to handle connection differently
const isServerless = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

let isConnected = false;

async function startServer() {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
      console.log("Database connected successfully");
    } catch (error) {
      console.error("Database connection failed:", error.message);
      if (!isServerless) {
        process.exit(1);
      }
    }
  }

  if (!isServerless) {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

// Start server
startServer().catch((error) => {
  console.error("Failed to start server:", error);
  if (!isServerless) {
    process.exit(1);
  }
});

// Export for Vercel serverless functions
export default app;

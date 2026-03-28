import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === "production";

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProduction ? Number(process.env.API_RATE_LIMIT || 300) : Number(process.env.API_RATE_LIMIT_DEV || 5000),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProduction ? Number(process.env.LOGIN_RATE_LIMIT || 10) : Number(process.env.LOGIN_RATE_LIMIT_DEV || 200),
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts, please try again later.",
  },
});

app.use("/api/auth/login", loginLimiter);
app.use(
  "/api",
  globalApiLimiter
);

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Admission Management API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

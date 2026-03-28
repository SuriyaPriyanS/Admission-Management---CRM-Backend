import mongoose from "mongoose";

mongoose.set("bufferCommands", false);
mongoose.set("bufferTimeoutMS", 0);

let connectionPromise = null;
let listenersBound = false;

function bindConnectionListeners() {
  if (listenersBound) return;

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.log("MongoDB disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected");
  });

  listenersBound = true;
}

export async function connectDB() {
  const mongoUri = process.env.MONGO_URI;
  console.log("Attempting to connect to MongoDB...", mongoUri);

  if (!mongoUri) {
    throw new Error("MONGO_URI environment variable is not defined");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    await connectionPromise;
    return mongoose.connection;
  }

  try {
    connectionPromise = mongoose.connect(mongoUri, {
      family: 4,
      bufferCommands: false,
      autoIndex: process.env.NODE_ENV !== "production",
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      connectTimeoutMS: 10000, // Give up initial connection after 10s
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 0, // Better for serverless cold starts
      retryWrites: true,
      w: "majority",
    });

    await connectionPromise;
    bindConnectionListeners();

    console.log("MongoDB connected successfully");
    return mongoose.connection;
  } catch (error) {
    connectionPromise = null;
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
}

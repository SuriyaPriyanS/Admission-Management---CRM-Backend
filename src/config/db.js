import mongoose from "mongoose";

export async function connectDB() {
  const mongoUri = process.env.MONGO_URI;
  // console.log("Connecting to MongoDB..." , mongoUri);

  

  await mongoose.connect(mongoUri, {
    autoIndex: true,
  });
}


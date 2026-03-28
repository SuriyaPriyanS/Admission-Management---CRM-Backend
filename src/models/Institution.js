import mongoose from "mongoose";

const institutionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    jkCapLimit: {
      type: Number,
      default: 0,
      min: 0,
    },
    jkCapUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

export const Institution = mongoose.model("Institution", institutionSchema);


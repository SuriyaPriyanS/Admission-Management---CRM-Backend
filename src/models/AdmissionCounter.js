import mongoose from "mongoose";

const admissionCounterSchema = new mongoose.Schema(
  {
    prefix: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    seq: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

export const AdmissionCounter = mongoose.model("AdmissionCounter", admissionCounterSchema);


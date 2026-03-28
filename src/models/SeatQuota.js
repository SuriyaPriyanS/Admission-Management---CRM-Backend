import mongoose from "mongoose";
import { QUOTA_TYPES } from "../utils/enums.js";

const seatQuotaSchema = new mongoose.Schema(
  {
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
      index: true,
    },
    quotaType: {
      type: String,
      enum: QUOTA_TYPES,
      required: true,
    },
    seats: {
      type: Number,
      required: true,
      min: 0,
    },
    filled: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    isSupernumerary: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

seatQuotaSchema.index({ programId: 1, quotaType: 1 }, { unique: true });

export const SeatQuota = mongoose.model("SeatQuota", seatQuotaSchema);


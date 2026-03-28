import mongoose from "mongoose";
import { ADMISSION_STATUSES, QUOTA_TYPES, FEE_STATUSES } from "../utils/enums.js";

const admissionSchema = new mongoose.Schema(
  {
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Applicant",
      required: true,
      unique: true,
      index: true,
    },
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
    allotmentNumber: {
      type: String,
      trim: true,
      default: null,
    },
    seatLocked: {
      type: Boolean,
      default: true,
    },
    feeStatus: {
      type: String,
      enum: FEE_STATUSES,
      default: "PENDING",
    },
    feePaidAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ADMISSION_STATUSES,
      default: "ALLOCATED",
    },
    admissionNumber: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export const Admission = mongoose.model("Admission", admissionSchema);


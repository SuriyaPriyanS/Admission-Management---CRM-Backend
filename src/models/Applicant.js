import mongoose from "mongoose";
import {
  CATEGORIES,
  ENTRY_TYPES,
  QUOTA_TYPES,
  DOC_STATUSES,
  ADMISSION_MODES,
} from "../utils/enums.js";

const applicantSchema = new mongoose.Schema(
  {
    applicationNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    category: {
      type: String,
      enum: CATEGORIES,
      required: true,
    },
    entryType: {
      type: String,
      enum: ENTRY_TYPES,
      required: true,
    },
    quotaType: {
      type: String,
      enum: QUOTA_TYPES.filter((q) => q !== "SUPERNUMERARY"),
      required: true,
    },
    admissionMode: {
      type: String,
      enum: ADMISSION_MODES,
      required: true,
    },
    qualifyingExam: {
      type: String,
      required: true,
      trim: true,
    },
    marks: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    documentsStatus: {
      type: String,
      enum: DOC_STATUSES,
      default: "PENDING",
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    isJkCandidate: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

applicantSchema.index({ email: 1, phone: 1 });

export const Applicant = mongoose.model("Applicant", applicantSchema);


import mongoose from "mongoose";
import { COURSE_TYPES, ENTRY_TYPES, ADMISSION_MODES } from "../utils/enums.js";

const programSchema = new mongoose.Schema(
  {
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
      index: true,
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    academicYear: {
      type: String,
      required: true,
      trim: true,
    },
    courseType: {
      type: String,
      enum: COURSE_TYPES,
      required: true,
    },
    entryType: {
      type: String,
      enum: ENTRY_TYPES,
      required: true,
    },
    admissionMode: {
      type: String,
      enum: ADMISSION_MODES,
      required: true,
    },
    totalIntake: {
      type: Number,
      required: true,
      min: 1,
    },
    supernumerarySeats: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { timestamps: true }
);

programSchema.index(
  { departmentId: 1, code: 1, academicYear: 1, entryType: 1 },
  { unique: true }
);

export const Program = mongoose.model("Program", programSchema);


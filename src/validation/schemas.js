import Joi from "joi";
import {
  ROLES,
  COURSE_TYPES,
  ENTRY_TYPES,
  ADMISSION_MODES,
  QUOTA_TYPES,
  CATEGORIES,
  DOC_STATUSES,
  FEE_STATUSES,
} from "../utils/enums.js";

const objectId = Joi.string().length(24).hex();

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(50).required(),
  role: Joi.string()
    .valid(...ROLES)
    .default("OFFICER"),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const institutionSchema = Joi.object({
  code: Joi.string().min(2).max(20).uppercase().required(),
  name: Joi.string().min(2).max(150).required(),
  jkCapLimit: Joi.number().integer().min(0).default(0),
});

export const campusSchema = Joi.object({
  institutionId: objectId.required(),
  name: Joi.string().min(2).max(150).required(),
});

export const departmentSchema = Joi.object({
  campusId: objectId.required(),
  name: Joi.string().min(2).max(150).required(),
  code: Joi.string().min(2).max(20).uppercase().required(),
});

export const programSchema = Joi.object({
  departmentId: objectId.required(),
  name: Joi.string().min(2).max(150).required(),
  code: Joi.string().min(2).max(20).uppercase().required(),
  academicYear: Joi.string()
    .pattern(/^\d{4}-\d{2}$/)
    .required()
    .messages({
      "string.pattern.base": "academicYear must be in format YYYY-YY (example: 2026-27)",
    }),
  courseType: Joi.string()
    .valid(...COURSE_TYPES)
    .required(),
  entryType: Joi.string()
    .valid(...ENTRY_TYPES)
    .required(),
  admissionMode: Joi.string()
    .valid(...ADMISSION_MODES)
    .required(),
  totalIntake: Joi.number().integer().min(1).required(),
  supernumerarySeats: Joi.number().integer().min(0).default(0),
  quotas: Joi.array()
    .items(
      Joi.object({
        quotaType: Joi.string()
          .valid("KCET", "COMEDK", "MANAGEMENT")
          .required(),
        seats: Joi.number().integer().min(0).required(),
      })
    )
    .min(1)
    .required(),
});

export const applicantSchema = Joi.object({
  applicationNo: Joi.string().min(3).max(30).uppercase().required(),
  fullName: Joi.string().min(2).max(120).required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.pattern.base": "phone must be a 10 digit number",
    }),
  gender: Joi.string().valid("MALE", "FEMALE", "OTHER").required(),
  dateOfBirth: Joi.date().less("now").required(),
  category: Joi.string()
    .valid(...CATEGORIES)
    .required(),
  entryType: Joi.string()
    .valid(...ENTRY_TYPES)
    .required(),
  quotaType: Joi.string().valid("KCET", "COMEDK", "MANAGEMENT").required(),
  admissionMode: Joi.string()
    .valid(...ADMISSION_MODES)
    .required(),
  qualifyingExam: Joi.string().max(60).required(),
  marks: Joi.number().min(0).max(100).required(),
  documentsStatus: Joi.string()
    .valid(...DOC_STATUSES)
    .default("PENDING"),
  address: Joi.string().max(250).required(),
  isJkCandidate: Joi.boolean().default(false),
});

export const applicantDocumentsSchema = Joi.object({
  documentsStatus: Joi.string()
    .valid(...DOC_STATUSES)
    .required(),
});

export const seatAllocationSchema = Joi.object({
  applicantId: objectId.required(),
  programId: objectId.required(),
  quotaType: Joi.string()
    .valid(...QUOTA_TYPES)
    .required(),
  allotmentNumber: Joi.string().allow("", null),
});

export const feeStatusSchema = Joi.object({
  feeStatus: Joi.string()
    .valid(...FEE_STATUSES)
    .required(),
});


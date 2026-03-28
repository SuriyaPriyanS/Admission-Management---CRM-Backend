import { Applicant } from "../models/Applicant.js";
import { Admission } from "../models/Admission.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createApplicant = asyncHandler(async (req, res) => {
  const applicant = await Applicant.create(req.body);
  res.status(201).json({
    success: true,
    data: applicant,
  });
});

export const listApplicants = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.documentsStatus) {
    filter.documentsStatus = req.query.documentsStatus;
  }
  if (req.query.quotaType) {
    filter.quotaType = req.query.quotaType;
  }
  if (req.query.admissionMode) {
    filter.admissionMode = req.query.admissionMode;
  }

  const applicants = await Applicant.find(filter).sort({ createdAt: -1 });
  res.json({
    success: true,
    data: applicants,
  });
});

export const updateApplicant = asyncHandler(async (req, res) => {
  const existing = await Applicant.findById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: "Applicant not found" });
  }

  const linkedAdmission = await Admission.findOne({ applicantId: existing._id });
  if (linkedAdmission) {
    if (
      req.body.quotaType &&
      req.body.quotaType !== existing.quotaType
    ) {
      return res.status(409).json({
        success: false,
        message: "Cannot change quotaType after seat allocation.",
      });
    }

    if (
      req.body.entryType &&
      req.body.entryType !== existing.entryType
    ) {
      return res.status(409).json({
        success: false,
        message: "Cannot change entryType after seat allocation.",
      });
    }
  }

  const applicant = await Applicant.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.json({
    success: true,
    data: applicant,
  });
});

export const deleteApplicant = asyncHandler(async (req, res) => {
  const linkedAdmission = await Admission.findOne({ applicantId: req.params.id });
  if (linkedAdmission) {
    return res.status(409).json({
      success: false,
      message: "Cannot delete applicant with admission record.",
    });
  }

  const deleted = await Applicant.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: "Applicant not found" });
  }

  res.json({ success: true, message: "Applicant deleted" });
});

export const updateApplicantDocuments = asyncHandler(async (req, res) => {
  const applicant = await Applicant.findByIdAndUpdate(
    req.params.id,
    { documentsStatus: req.body.documentsStatus },
    { new: true }
  );

  if (!applicant) {
    return res.status(404).json({
      success: false,
      message: "Applicant not found",
    });
  }

  res.json({
    success: true,
    data: applicant,
  });
});

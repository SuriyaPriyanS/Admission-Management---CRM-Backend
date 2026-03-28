import { Admission } from "../models/Admission.js";
import { Applicant } from "../models/Applicant.js";
import { Institution } from "../models/Institution.js";
import { Program } from "../models/Program.js";
import { SeatQuota } from "../models/SeatQuota.js";
import { generateAdmissionNumber } from "../services/admissionNumberService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

async function rollbackSeatAndCap({ program, quotaType, applicant }) {
  await SeatQuota.updateOne(
    { programId: program._id, quotaType, filled: { $gt: 0 } },
    { $inc: { filled: -1 } }
  );

  if (applicant?.isJkCandidate) {
    await Institution.updateOne(
      { _id: program.institutionId, jkCapUsed: { $gt: 0 } },
      { $inc: { jkCapUsed: -1 } }
    );
  }
}

export const checkQuotaAvailability = asyncHandler(async (req, res) => {
  const { programId, quotaType } = req.params;
  const quota = await SeatQuota.findOne({ programId, quotaType });

  if (!quota) {
    return res.status(404).json({
      success: false,
      message: "Quota configuration not found",
    });
  }

  const remaining = quota.seats - quota.filled;
  return res.json({
    success: true,
    data: {
      quotaType: quota.quotaType,
      seats: quota.seats,
      filled: quota.filled,
      remaining,
      available: remaining > 0,
      totalSeats: quota.seats,
    },
  });
});

export const allocateSeat = asyncHandler(async (req, res) => {
  const { applicantId, programId, quotaType, allotmentNumber } = req.body;

  const [applicant, program] = await Promise.all([
    Applicant.findById(applicantId),
    Program.findById(programId),
  ]);

  if (!applicant) {
    return res.status(404).json({ success: false, message: "Applicant not found" });
  }
  if (!program) {
    return res.status(404).json({ success: false, message: "Program not found" });
  }

  const alreadyAllocated = await Admission.findOne({
    applicantId,
    status: { $in: ["ALLOCATED", "CONFIRMED"] },
  });
  if (alreadyAllocated) {
    return res.status(409).json({
      success: false,
      message: "Applicant already has an allocated/confirmed seat",
    });
  }

  if (applicant.quotaType !== quotaType && quotaType !== "SUPERNUMERARY") {
    return res.status(400).json({
      success: false,
      message: "Selected quota does not match applicant quota type",
    });
  }

  const isGovernmentQuota = quotaType === "KCET" || quotaType === "COMEDK";
  if (isGovernmentQuota && !allotmentNumber) {
    return res.status(400).json({
      success: false,
      message: "Allotment number is required for government quota admissions",
    });
  }

  const seatQuota = await SeatQuota.findOneAndUpdate(
    {
      programId,
      quotaType,
      $expr: { $lt: ["$filled", "$seats"] },
    },
    { $inc: { filled: 1 } },
    { new: true }
  );

  if (!seatQuota) {
    return res.status(409).json({
      success: false,
      message: `No seats available in ${quotaType} quota`,
    });
  }

  try {
    if (applicant.isJkCandidate) {
      const institution = await Institution.findById(program.institutionId);
      if (institution && institution.jkCapLimit > 0) {
        const updatedCap = await Institution.findOneAndUpdate(
          {
            _id: institution._id,
            $expr: { $lt: ["$jkCapUsed", "$jkCapLimit"] },
          },
          { $inc: { jkCapUsed: 1 } },
          { new: true }
        );

        if (!updatedCap) {
          await rollbackSeatAndCap({ program, quotaType, applicant: null });
          return res.status(409).json({
            success: false,
            message: "Institution-level J&K cap reached",
          });
        }
      }
    }

    const admission = await Admission.create({
      applicantId,
      programId,
      quotaType,
      allotmentNumber: allotmentNumber || null,
      seatLocked: true,
      feeStatus: "PENDING",
      status: "ALLOCATED",
    });

    return res.status(201).json({
      success: true,
      message: "Seat allocated successfully",
      data: admission,
    });
  } catch (error) {
    await rollbackSeatAndCap({ program, quotaType, applicant });
    throw error;
  }
});

export const updateAdmission = asyncHandler(async (req, res) => {
  const admission = await Admission.findById(req.params.id);
  if (!admission) {
    return res.status(404).json({ success: false, message: "Admission not found" });
  }

  if (admission.status === "CONFIRMED") {
    return res.status(409).json({
      success: false,
      message: "Confirmed admissions are immutable.",
    });
  }

  const disallowedChange =
    (req.body.applicantId && String(req.body.applicantId) !== String(admission.applicantId)) ||
    (req.body.programId && String(req.body.programId) !== String(admission.programId)) ||
    (req.body.quotaType && req.body.quotaType !== admission.quotaType);

  if (disallowedChange) {
    return res.status(409).json({
      success: false,
      message: "Applicant, program, and quota cannot be changed after allocation.",
    });
  }

  if (req.body.allotmentNumber !== undefined) {
    admission.allotmentNumber = req.body.allotmentNumber || null;
  }

  await admission.save();

  res.json({ success: true, data: admission });
});

export const deleteAdmission = asyncHandler(async (req, res) => {
  const admission = await Admission.findById(req.params.id);
  if (!admission) {
    return res.status(404).json({ success: false, message: "Admission not found" });
  }

  if (admission.status === "CONFIRMED") {
    return res.status(409).json({
      success: false,
      message: "Confirmed admissions cannot be deleted.",
    });
  }

  const [program, applicant] = await Promise.all([
    Program.findById(admission.programId),
    Applicant.findById(admission.applicantId),
  ]);

  if (program) {
    await SeatQuota.updateOne(
      {
        programId: admission.programId,
        quotaType: admission.quotaType,
        filled: { $gt: 0 },
      },
      { $inc: { filled: -1 } }
    );
  }

  if (program && applicant?.isJkCandidate) {
    await Institution.updateOne(
      { _id: program.institutionId, jkCapUsed: { $gt: 0 } },
      { $inc: { jkCapUsed: -1 } }
    );
  }

  await Admission.deleteOne({ _id: admission._id });

  res.json({ success: true, message: "Admission deleted" });
});

export const updateFeeStatus = asyncHandler(async (req, res) => {
  const { feeStatus } = req.body;
  const admission = await Admission.findById(req.params.id);

  if (!admission) {
    return res.status(404).json({
      success: false,
      message: "Admission not found",
    });
  }

  if (admission.status === "CONFIRMED" && feeStatus === "PENDING") {
    return res.status(400).json({
      success: false,
      message: "Cannot mark fee pending after admission confirmation",
    });
  }

  admission.feeStatus = feeStatus;
  admission.feePaidAt = feeStatus === "PAID" ? new Date() : null;
  await admission.save();

  res.json({
    success: true,
    message: "Fee status updated",
    data: admission,
  });
});

export const confirmAdmission = asyncHandler(async (req, res) => {
  const admission = await Admission.findById(req.params.id);
  if (!admission) {
    return res.status(404).json({ success: false, message: "Admission not found" });
  }

  if (admission.admissionNumber) {
    return res.status(409).json({
      success: false,
      message: "Admission number already generated and immutable",
    });
  }

  if (admission.status !== "ALLOCATED") {
    return res.status(400).json({
      success: false,
      message: "Only allocated admissions can be confirmed",
    });
  }

  if (admission.feeStatus !== "PAID") {
    return res.status(400).json({
      success: false,
      message: "Admission can be confirmed only when fee status is PAID",
    });
  }

  const applicant = await Applicant.findById(admission.applicantId);
  if (!applicant) {
    return res.status(404).json({ success: false, message: "Applicant not found" });
  }

  if (applicant.documentsStatus !== "VERIFIED") {
    return res.status(400).json({
      success: false,
      message: "Documents must be VERIFIED before admission confirmation",
    });
  }

  const program = await Program.findById(admission.programId);
  if (!program) {
    return res.status(404).json({ success: false, message: "Program not found" });
  }

  const admissionNumber = await generateAdmissionNumber({
    program,
    quotaType: admission.quotaType,
  });

  const updated = await Admission.findOneAndUpdate(
    {
      _id: admission._id,
      admissionNumber: null,
      status: "ALLOCATED",
    },
    {
      $set: {
        admissionNumber,
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
    },
    { new: true }
  );

  if (!updated) {
    return res.status(409).json({
      success: false,
      message: "Admission already confirmed by another request",
    });
  }

  return res.json({
    success: true,
    message: "Admission confirmed successfully",
    data: updated,
  });
});

export const listAdmissions = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.feeStatus) {
    filter.feeStatus = req.query.feeStatus;
  }

  const admissions = await Admission.find(filter)
    .sort({ createdAt: -1 })
    .populate("applicantId", "applicationNo fullName documentsStatus quotaType")
    .populate("programId", "name code academicYear courseType");

  res.json({
    success: true,
    data: admissions,
  });
});

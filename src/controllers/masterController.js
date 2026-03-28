import { Campus } from "../models/Campus.js";
import { Department } from "../models/Department.js";
import { Institution } from "../models/Institution.js";
import { Program } from "../models/Program.js";
import { SeatQuota } from "../models/SeatQuota.js";
import { Admission } from "../models/Admission.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const BASE_QUOTAS = ["KCET", "COMEDK", "MANAGEMENT"];

function validateQuotaTotal(quotas, totalIntake) {
  const uniqueQuotaTypes = new Set(quotas.map((q) => q.quotaType));
  if (uniqueQuotaTypes.size !== quotas.length) {
    throw new Error("Duplicate quota types are not allowed.");
  }

  const baseQuotaTotal = quotas.reduce((sum, quota) => sum + quota.seats, 0);
  if (baseQuotaTotal !== Number(totalIntake)) {
    throw new Error(
      `Quota mismatch: base quota total (${baseQuotaTotal}) must equal total intake (${totalIntake}).`
    );
  }
}

function normalizeBaseQuotas(quotas = []) {
  const map = new Map();
  for (const quota of quotas) {
    if (!BASE_QUOTAS.includes(quota.quotaType)) continue;
    map.set(quota.quotaType, Number(quota.seats || 0));
  }

  return BASE_QUOTAS.map((quotaType) => ({
    quotaType,
    seats: map.get(quotaType) || 0,
  }));
}

async function applySeatMatrix({ programId, totalIntake, supernumerarySeats = 0, quotas }) {
  const normalizedQuotas = normalizeBaseQuotas(quotas);
  validateQuotaTotal(normalizedQuotas, totalIntake);

  const existingQuotas = await SeatQuota.find({ programId });
  const existingMap = new Map(existingQuotas.map((quota) => [quota.quotaType, quota]));

  for (const quota of normalizedQuotas) {
    const existing = existingMap.get(quota.quotaType);
    if (existing && existing.filled > quota.seats) {
      throw new Error(
        `${quota.quotaType} seats cannot be less than already filled seats (${existing.filled}).`
      );
    }
  }

  for (const quota of normalizedQuotas) {
    const existing = existingMap.get(quota.quotaType);
    if (existing) {
      existing.seats = quota.seats;
      await existing.save();
    } else {
      await SeatQuota.create({
        programId,
        quotaType: quota.quotaType,
        seats: quota.seats,
        filled: 0,
        isSupernumerary: false,
      });
    }
  }

  const supExisting = existingMap.get("SUPERNUMERARY");
  const supSeats = Number(supernumerarySeats || 0);

  if (supSeats > 0) {
    if (supExisting) {
      if (supExisting.filled > supSeats) {
        throw new Error(
          `SUPERNUMERARY seats cannot be less than already filled seats (${supExisting.filled}).`
        );
      }
      supExisting.seats = supSeats;
      supExisting.isSupernumerary = true;
      await supExisting.save();
    } else {
      await SeatQuota.create({
        programId,
        quotaType: "SUPERNUMERARY",
        seats: supSeats,
        filled: 0,
        isSupernumerary: true,
      });
    }
  } else if (supExisting) {
    if (supExisting.filled > 0) {
      throw new Error("Cannot remove supernumerary seats after allocations are done.");
    }
    await SeatQuota.deleteOne({ _id: supExisting._id });
  }
}

export const createInstitution = asyncHandler(async (req, res) => {
  const institution = await Institution.create(req.body);
  res.status(201).json({ success: true, data: institution });
});

export const listInstitutions = asyncHandler(async (req, res) => {
  const institutions = await Institution.find().sort({ createdAt: -1 });
  res.json({ success: true, data: institutions });
});

export const updateInstitution = asyncHandler(async (req, res) => {
  const institution = await Institution.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!institution) {
    return res.status(404).json({ success: false, message: "Institution not found" });
  }

  res.json({ success: true, data: institution });
});

export const deleteInstitution = asyncHandler(async (req, res) => {
  const hasCampus = await Campus.exists({ institutionId: req.params.id });
  if (hasCampus) {
    return res.status(409).json({
      success: false,
      message: "Cannot delete institution with campuses. Delete child records first.",
    });
  }

  const deleted = await Institution.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: "Institution not found" });
  }

  res.json({ success: true, message: "Institution deleted" });
});

export const createCampus = asyncHandler(async (req, res) => {
  const institution = await Institution.findById(req.body.institutionId);
  if (!institution) {
    return res.status(404).json({ success: false, message: "Institution not found" });
  }

  const campus = await Campus.create(req.body);
  res.status(201).json({ success: true, data: campus });
});

export const listCampuses = asyncHandler(async (req, res) => {
  const filter = req.query.institutionId ? { institutionId: req.query.institutionId } : {};
  const campuses = await Campus.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: campuses });
});

export const updateCampus = asyncHandler(async (req, res) => {
  const campus = await Campus.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!campus) {
    return res.status(404).json({ success: false, message: "Campus not found" });
  }

  res.json({ success: true, data: campus });
});

export const deleteCampus = asyncHandler(async (req, res) => {
  const hasDepartment = await Department.exists({ campusId: req.params.id });
  if (hasDepartment) {
    return res.status(409).json({
      success: false,
      message: "Cannot delete campus with departments. Delete child records first.",
    });
  }

  const deleted = await Campus.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: "Campus not found" });
  }

  res.json({ success: true, message: "Campus deleted" });
});

export const createDepartment = asyncHandler(async (req, res) => {
  const campus = await Campus.findById(req.body.campusId);
  if (!campus) {
    return res.status(404).json({ success: false, message: "Campus not found" });
  }

  const department = await Department.create(req.body);
  res.status(201).json({ success: true, data: department });
});

export const listDepartments = asyncHandler(async (req, res) => {
  const filter = req.query.campusId ? { campusId: req.query.campusId } : {};
  const departments = await Department.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: departments });
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!department) {
    return res.status(404).json({ success: false, message: "Department not found" });
  }

  res.json({ success: true, data: department });
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  const hasProgram = await Program.exists({ departmentId: req.params.id });
  if (hasProgram) {
    return res.status(409).json({
      success: false,
      message: "Cannot delete department with programs. Delete child records first.",
    });
  }

  const deleted = await Department.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: "Department not found" });
  }

  res.json({ success: true, message: "Department deleted" });
});

export const createProgram = asyncHandler(async (req, res) => {
  const {
    departmentId,
    name,
    code,
    academicYear,
    courseType,
    entryType,
    admissionMode,
    totalIntake,
    supernumerarySeats,
    quotas,
  } = req.body;

  const normalizedQuotas = normalizeBaseQuotas(quotas);
  validateQuotaTotal(normalizedQuotas, totalIntake);

  const department = await Department.findById(departmentId);
  if (!department) {
    return res.status(404).json({ success: false, message: "Department not found" });
  }

  const campus = await Campus.findById(department.campusId);
  if (!campus) {
    return res.status(404).json({ success: false, message: "Campus not found for department" });
  }

  const program = await Program.create({
    institutionId: campus.institutionId,
    campusId: campus._id,
    departmentId,
    name,
    code,
    academicYear,
    courseType,
    entryType,
    admissionMode,
    totalIntake,
    supernumerarySeats: Number(supernumerarySeats || 0),
  });

  await applySeatMatrix({
    programId: program._id,
    totalIntake,
    supernumerarySeats,
    quotas: normalizedQuotas,
  });

  const quotasData = await SeatQuota.find({ programId: program._id });
  res.status(201).json({ success: true, data: { program, quotas: quotasData } });
});

export const updateProgram = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id);
  if (!program) {
    return res.status(404).json({ success: false, message: "Program not found" });
  }

  const nextData = {
    departmentId: req.body.departmentId || program.departmentId,
    name: req.body.name || program.name,
    code: req.body.code || program.code,
    academicYear: req.body.academicYear || program.academicYear,
    courseType: req.body.courseType || program.courseType,
    entryType: req.body.entryType || program.entryType,
    admissionMode: req.body.admissionMode || program.admissionMode,
    totalIntake: Number(req.body.totalIntake ?? program.totalIntake),
    supernumerarySeats: Number(req.body.supernumerarySeats ?? program.supernumerarySeats ?? 0),
  };

  if (req.body.departmentId) {
    const department = await Department.findById(req.body.departmentId);
    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    const campus = await Campus.findById(department.campusId);
    if (!campus) {
      return res.status(404).json({ success: false, message: "Campus not found for department" });
    }

    nextData.campusId = campus._id;
    nextData.institutionId = campus.institutionId;
  }

  const quotas = req.body.quotas
    ? normalizeBaseQuotas(req.body.quotas)
    : normalizeBaseQuotas((await SeatQuota.find({ programId: program._id, isSupernumerary: false })));

  await applySeatMatrix({
    programId: program._id,
    totalIntake: nextData.totalIntake,
    supernumerarySeats: nextData.supernumerarySeats,
    quotas,
  });

  const updatedProgram = await Program.findByIdAndUpdate(req.params.id, nextData, {
    new: true,
    runValidators: true,
  });

  const updatedQuotas = await SeatQuota.find({ programId: req.params.id });
  res.json({ success: true, data: { program: updatedProgram, quotas: updatedQuotas } });
});

export const updateProgramQuotas = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id);
  if (!program) {
    return res.status(404).json({ success: false, message: "Program not found" });
  }

  const quotas = normalizeBaseQuotas(req.body.quotas || []);
  const supernumerarySeats = Number(req.body.supernumerarySeats ?? program.supernumerarySeats ?? 0);

  await applySeatMatrix({
    programId: program._id,
    totalIntake: program.totalIntake,
    supernumerarySeats,
    quotas,
  });

  program.supernumerarySeats = supernumerarySeats;
  await program.save();

  const updatedQuotas = await SeatQuota.find({ programId: program._id });
  res.json({ success: true, data: updatedQuotas });
});

export const deleteProgram = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id);
  if (!program) {
    return res.status(404).json({ success: false, message: "Program not found" });
  }

  const hasAdmissions = await Admission.exists({ programId: program._id });
  if (hasAdmissions) {
    return res.status(409).json({
      success: false,
      message: "Cannot delete program with admissions.",
    });
  }

  await SeatQuota.deleteMany({ programId: program._id });
  await Program.deleteOne({ _id: program._id });

  res.json({ success: true, message: "Program deleted" });
});

export const listPrograms = asyncHandler(async (req, res) => {
  const programs = await Program.find()
    .sort({ createdAt: -1 })
    .populate("institutionId", "name code")
    .populate("campusId", "name")
    .populate("departmentId", "name code");

  const programIds = programs.map((p) => p._id);
  const quotas = await SeatQuota.find({ programId: { $in: programIds } });

  const quotaMap = new Map();
  quotas.forEach((quota) => {
    const key = quota.programId.toString();
    const existing = quotaMap.get(key) || [];
    existing.push(quota);
    quotaMap.set(key, existing);
  });

  const data = programs.map((program) => ({
    ...program.toObject(),
    quotas: quotaMap.get(program._id.toString()) || [],
  }));

  res.json({ success: true, data });
});

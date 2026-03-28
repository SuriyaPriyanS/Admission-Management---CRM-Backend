import { AdmissionCounter } from "../models/AdmissionCounter.js";
import { Institution } from "../models/Institution.js";
import { Department } from "../models/Department.js";

export async function generateAdmissionNumber({ program, quotaType }) {
  const institution = await Institution.findById(program.institutionId).select("code");
  if (!institution) {
    throw new Error("Institution not found for program");
  }

  const department = await Department.findById(program.departmentId).select("code");
  if (!department) {
    throw new Error("Department not found for program");
  }

  const year = String(program.academicYear).slice(0, 4);
  const prefix = `${institution.code}/${year}/${program.courseType}/${department.code}/${quotaType}`;

  const counter = await AdmissionCounter.findOneAndUpdate(
    { prefix },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const sequence = String(counter.seq).padStart(4, "0");
  return `${prefix}/${sequence}`;
}


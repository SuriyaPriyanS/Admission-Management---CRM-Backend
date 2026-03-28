import { Router } from "express";
import {
  createCampus,
  createDepartment,
  createInstitution,
  createProgram,
  deleteCampus,
  deleteDepartment,
  deleteInstitution,
  deleteProgram,
  listCampuses,
  listDepartments,
  listInstitutions,
  listPrograms,
  updateCampus,
  updateDepartment,
  updateInstitution,
  updateProgram,
  updateProgramQuotas,
} from "../controllers/masterController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  campusSchema,
  departmentSchema,
  institutionSchema,
  programSchema,
} from "../validation/schemas.js";

const router = Router();

router.use(authenticate);

router
  .route("/institutions")
  .post(authorize("ADMIN"), validate(institutionSchema), createInstitution)
  .get(listInstitutions);

router
  .route("/institutions/:id")
  .put(authorize("ADMIN"), updateInstitution)
  .delete(authorize("ADMIN"), deleteInstitution);

router
  .route("/campuses")
  .post(authorize("ADMIN"), validate(campusSchema), createCampus)
  .get(listCampuses);

router
  .route("/campuses/:id")
  .put(authorize("ADMIN"), updateCampus)
  .delete(authorize("ADMIN"), deleteCampus);

router
  .route("/departments")
  .post(authorize("ADMIN"), validate(departmentSchema), createDepartment)
  .get(listDepartments);

router
  .route("/departments/:id")
  .put(authorize("ADMIN"), updateDepartment)
  .delete(authorize("ADMIN"), deleteDepartment);

router
  .route("/programs")
  .post(authorize("ADMIN"), validate(programSchema), createProgram)
  .get(listPrograms);

router
  .route("/programs/:id")
  .put(authorize("ADMIN"), updateProgram)
  .delete(authorize("ADMIN"), deleteProgram);

router.patch("/programs/:id/quotas", authorize("ADMIN"), updateProgramQuotas);

export default router;

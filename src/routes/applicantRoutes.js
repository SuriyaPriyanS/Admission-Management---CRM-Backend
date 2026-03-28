import { Router } from "express";
import {
  createApplicant,
  deleteApplicant,
  listApplicants,
  updateApplicant,
  updateApplicantDocuments,
} from "../controllers/applicantController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { applicantDocumentsSchema, applicantSchema } from "../validation/schemas.js";

const router = Router();

router.use(authenticate);
router.use(authorize("OFFICER", "ADMIN"));

router.route("/").post(validate(applicantSchema), createApplicant).get(listApplicants);
router.route("/:id").put(updateApplicant).delete(deleteApplicant);
router.patch("/:id/documents", validate(applicantDocumentsSchema), updateApplicantDocuments);

export default router;

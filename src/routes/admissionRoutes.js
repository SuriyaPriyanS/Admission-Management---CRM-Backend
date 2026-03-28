import { Router } from "express";
import {
  allocateSeat,
  checkQuotaAvailability,
  confirmAdmission,
  deleteAdmission,
  listAdmissions,
  updateAdmission,
  updateFeeStatus,
} from "../controllers/admissionController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { feeStatusSchema, seatAllocationSchema } from "../validation/schemas.js";

const router = Router();

router.use(authenticate);
router.use(authorize("OFFICER", "ADMIN"));

router.get("/", listAdmissions);
router.get("/availability/:programId/:quotaType", checkQuotaAvailability);
router.post("/allocate", validate(seatAllocationSchema), allocateSeat);
router.put("/:id", updateAdmission);
router.delete("/:id", deleteAdmission);
router.patch("/:id/fee", validate(feeStatusSchema), updateFeeStatus);
router.patch("/:id/confirm", confirmAdmission);

export default router;

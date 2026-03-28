import { Router } from "express";
import { getDashboard } from "../controllers/dashboardController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.use(authorize("MANAGEMENT", "ADMIN"));
router.get("/", getDashboard);

export default router;


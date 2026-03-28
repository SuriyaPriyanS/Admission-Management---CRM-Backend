import { Router } from "express";
import admissionRoutes from "./admissionRoutes.js";
import applicantRoutes from "./applicantRoutes.js";
import authRoutes from "./authRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import masterRoutes from "./masterRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/masters", masterRoutes);
router.use("/applicants", applicantRoutes);
router.use("/admissions", admissionRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;


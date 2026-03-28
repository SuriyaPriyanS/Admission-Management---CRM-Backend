import { Router } from "express";
import { login, me, register } from "../controllers/authController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../validation/schemas.js";

const router = Router();

router.post("/register", authenticate, authorize("ADMIN"), validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", authenticate, me);

export default router;

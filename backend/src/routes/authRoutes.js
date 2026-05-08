import express from "express";
import { register, login } from "../controllers/authController.js";
import { validateBody, registerSchema } from "../middleware/validate.js";

const router = express.Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", login);

export default router;


import express from "express";
import { 
  register, 
  login, 
  verifyEmail, 
  forgotPassword, 
  resetPassword, 
  refreshToken, 
  googleAuth, 
  githubAuth 
} from "../controllers/authController.js";
import { validateBody, registerSchema } from "../middleware/validate.js";

const router = express.Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", login);
router.get("/verify-email/:token", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);
router.post("/refresh-token", refreshToken);
router.post("/google", googleAuth);
router.post("/github", githubAuth);

export default router;


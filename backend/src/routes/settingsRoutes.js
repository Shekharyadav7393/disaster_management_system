import express from "express";
import { getSettings, updateSettings } from "../controllers/settingsController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), getSettings);
router.put("/", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), updateSettings);

export default router;

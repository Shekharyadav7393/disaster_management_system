import express from "express";
import {
  getMissions,
  createMission,
  updateMission,
  deleteMission,
} from "../controllers/missionController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getMissions);
router.post("/", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), createMission);
router.put("/:id", protect, updateMission);
router.delete("/:id", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), deleteMission);

export default router;

import express from "express";
import {
  getAlerts,
  getAlertById,
  createAlert,
  deleteAlert,
  getTimeline,
  createTimelineEntry,
} from "../controllers/alertController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public
router.get("/", getAlerts);
router.get("/:id", getAlertById);

// Admin
router.post("/", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), createAlert);
router.delete("/:id", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), deleteAlert);

export default router;

// Timeline routes are exported separately
export const timelineRouter = express.Router();
timelineRouter.get("/:id", getTimeline);
timelineRouter.post("/", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), createTimelineEntry);

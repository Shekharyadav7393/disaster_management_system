import express from "express";
import {
  registerVolunteer,
  getMyVolunteerProfile,
  getAllVolunteers,
  updateVolunteerStatus,
  logVolunteerActivity,
  assignVolunteer,
} from "../controllers/volunteerController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// User
router.post("/register", protect, registerVolunteer);
router.get("/me", protect, getMyVolunteerProfile);

// Admin
router.get("/", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), getAllVolunteers);
router.patch("/:id/status", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), updateVolunteerStatus);
router.patch("/:id/activity", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), logVolunteerActivity);
router.patch("/:id/assign", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), assignVolunteer);

export default router;

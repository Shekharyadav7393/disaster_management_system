import express from "express";
import {
  createRequest,
  getRequests,
  assignTeam,
  updateRequestStatus,
} from "../controllers/requestController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// User: create request
router.post("/", protect, authorizeRoles("citizen", "volunteer", "rescue_team", "super_admin", "emergency_admin", "user", "admin", "rescue"), createRequest);

// Admin + rescue: list requests
router.get("/", protect, authorizeRoles("super_admin", "emergency_admin", "admin", "rescue_team", "rescue"), getRequests);

// Admin: assign team
router.put("/:id/assign-team", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), assignTeam);

// Admin + rescue: update status
router.put("/:id/status", protect, authorizeRoles("super_admin", "emergency_admin", "admin", "rescue_team", "rescue"), updateRequestStatus);

export default router;

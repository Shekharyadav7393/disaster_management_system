import express from "express";
import {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  bulkUpdateStatus,
} from "../controllers/teamController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { validateBody, teamCreateSchema, teamUpdateSchema, bulkStatusSchema } from "../middleware/validate.js";

const router = express.Router();

// Public (for dropdowns, dispatch info display)
router.get("/", getTeams);
router.get("/:id", getTeamById);

// Admin-only (create, update, delete, bulk)
router.post(
  "/",
  protect,
  authorizeRoles("super_admin", "emergency_admin", "admin"),
  validateBody(teamCreateSchema),
  createTeam
);
router.put(
  "/:id",
  protect,
  authorizeRoles("super_admin", "emergency_admin", "admin"),
  validateBody(teamUpdateSchema),
  updateTeam
);
router.delete(
  "/:id",
  protect,
  authorizeRoles("super_admin", "emergency_admin", "admin"),
  deleteTeam
);
router.patch(
  "/bulk-status",
  protect,
  authorizeRoles("super_admin", "emergency_admin", "admin"),
  validateBody(bulkStatusSchema),
  bulkUpdateStatus
);

export default router;

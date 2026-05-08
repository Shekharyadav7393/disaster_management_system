import express from "express";
import {
  getReliefCamps,
  getNearestReliefCamps,
  createReliefCamp,
  updateReliefCamp,
  deleteReliefCamp,
  getResources,
  createResource,
  deleteResource,
} from "../controllers/reliefCampController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public
router.get("/", getReliefCamps);
router.get("/nearest", getNearestReliefCamps);

// Admin
router.post("/", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), createReliefCamp);
router.put("/:id", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), updateReliefCamp);
router.delete("/:id", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), deleteReliefCamp);

export default router;

// Resource routes (mounted separately at /api/resources)
export const resourceRouter = express.Router();
resourceRouter.get("/:campId", getResources);
resourceRouter.post("/", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), createResource);
resourceRouter.delete("/:id", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), deleteResource);

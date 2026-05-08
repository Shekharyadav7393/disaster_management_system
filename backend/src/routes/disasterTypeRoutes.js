import express from "express";
import {
  getDisasterTypes,
  createDisasterType,
  updateDisasterType,
  deleteDisasterType,
} from "../controllers/disasterTypeController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getDisasterTypes);
router.post("/", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), createDisasterType);
router.put("/:id", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), updateDisasterType);
router.delete("/:id", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), deleteDisasterType);

export default router;

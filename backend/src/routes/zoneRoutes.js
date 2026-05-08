import express from "express";
import {
  getZones,
  createZone,
  updateZone,
  deleteZone,
} from "../controllers/zoneController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getZones);
router.post("/", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), createZone);
router.put("/:id", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), updateZone);
router.delete("/:id", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), deleteZone);

export default router;

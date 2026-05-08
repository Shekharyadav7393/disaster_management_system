import express from "express";
import {
  getSensors,
  getSensorById,
  createSensor,
  updateSensor,
  simulateDisaster,
} from "../controllers/sensorController.js";
import {
  ingestReading,
  getReadingsByDevice,
} from "../controllers/sensorReadingController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Sensor ingestion (IoT device -> backend)
router.post("/:deviceId/readings", ingestReading);

// Admin/rescue read access
router.get("/", protect, authorizeRoles("super_admin", "emergency_admin", "admin", "rescue_team", "rescue"), getSensors);
router.get("/:id", protect, authorizeRoles("super_admin", "emergency_admin", "admin", "rescue_team", "rescue"), getSensorById);
router.get(
  "/:deviceId/readings",
  protect,
  authorizeRoles("super_admin", "emergency_admin", "admin", "rescue_team", "rescue"),
  getReadingsByDevice
);

// Admin manage sensors
router.post("/simulate", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), simulateDisaster);
router.post("/", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), createSensor);
router.put("/:id", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), updateSensor);

export default router;

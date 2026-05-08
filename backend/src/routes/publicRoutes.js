import express from "express";
import {
  getPublicStats,
  getPublicAlerts,
  createPublicHelpRequest,
  getPublicSettings,
} from "../controllers/publicController.js";

const router = express.Router();

router.get("/stats", getPublicStats);
router.get("/alerts/active", getPublicAlerts);
router.get("/settings", getPublicSettings);
router.post("/help-request", createPublicHelpRequest);

export default router;

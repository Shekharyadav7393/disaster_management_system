import express from "express";
import {
  getOverview,
  getDonationStats,
  getRescueStatus,
  getRecentMedia,
  getZoneRisk,
  getExternalSummary,
} from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/", getOverview);
router.get("/overview", getOverview);
router.get("/donation-stats", getDonationStats);
router.get("/rescue-status", getRescueStatus);
router.get("/recent-media", getRecentMedia);
router.get("/zone-risk", getZoneRisk);

export default router;

// External summary route (mounted at /api/external)
export const externalRouter = express.Router();
externalRouter.get("/summary", getExternalSummary);

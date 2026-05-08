import express from "express";
import {
  getAnalyticsSummary,
  getRegionalAnalytics,
  getHeatmap,
} from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/summary", getAnalyticsSummary);
router.get("/regional", getRegionalAnalytics);
router.get("/heatmap", getHeatmap);

export default router;

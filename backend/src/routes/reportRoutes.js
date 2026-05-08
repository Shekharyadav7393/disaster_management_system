import express from "express";
import {
  getReports,
  getVerifiedReports,
  getMyReports,
  createReport,
  updateReportStatus,
  deleteReportMedia,
} from "../controllers/reportController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { mediaUpload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Public
router.get("/verified", getVerifiedReports);

// User
router.get("/mine", protect, getMyReports);
router.post(
  "/",
  protect,
  mediaUpload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  createReport
);

// Admin
router.get("/", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), getReports);
router.patch("/:id/status", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), updateReportStatus);
router.delete("/:id/media", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), deleteReportMedia);

export default router;

import express from "express";
import {
  getNotifications,
  getPublicNotifications,
  getUserNotifications,
  createNotification,
  deleteNotification,
  markAsRead,
} from "../controllers/notificationController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public
router.get("/public", getPublicNotifications);

// User — personal notification feed
router.get("/mine", protect, getUserNotifications);
router.patch("/:id/read", protect, markAsRead);

// Admin
router.get("/", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), getNotifications);
router.post("/", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), createNotification);
router.delete("/:id", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), deleteNotification);

export default router;

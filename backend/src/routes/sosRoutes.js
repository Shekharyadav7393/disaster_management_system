import express from "express";
import { validateBody, sosSchema } from "../middleware/validate.js";

import {
  sendSOS,
  getMySOS,
  getAllSOS,
  updateSOSStatus,
  verifySOSSpam,
  deleteSOSMedia,
} from "../controllers/sosController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { mediaUpload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// User
router.post(
  "/",
  protect,
  mediaUpload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  validateBody(sosSchema),
  sendSOS
);
router.get("/mine", protect, getMySOS);

// Admin
router.get("/", protect, authorizeRoles("super_admin", "admin"), getAllSOS);
router.patch("/:id/status", protect, authorizeRoles("super_admin", "admin"), updateSOSStatus);
router.patch("/:id/verify-spam", protect, authorizeRoles("super_admin", "admin"), verifySOSSpam);
router.delete("/:id/media", protect, authorizeRoles("super_admin", "admin"), deleteSOSMedia);

export default router;

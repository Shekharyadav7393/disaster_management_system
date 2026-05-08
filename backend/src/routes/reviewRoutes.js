import express from "express";
import {
  createReview,
  getTeamReviews,
  getMyReviews,
  getAllReviews,
} from "../controllers/reviewController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public — view team reviews
router.get("/team/:teamId", getTeamReviews);

// Protected — user submits review
router.post("/", protect, createReview);
router.get("/mine", protect, getMyReviews);

// Admin — view all reviews
router.get("/", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), getAllReviews);

export default router;

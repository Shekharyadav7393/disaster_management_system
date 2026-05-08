import Review from "../models/Review.js";
import Team from "../models/Team.js";
import mongoose from "mongoose";

/**
 * POST /api/reviews
 * User submits a review for a team after being rescued.
 */
export const createReview = async (req, res) => {
  try {
    const { teamId, sosId, requestId, rating, professionalism, responseTime, comment } = req.body;

    if (!teamId || !rating) {
      return res.status(400).json({ message: "Team ID and rating are required." });
    }

    // Check team exists
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "Team not found." });

    // Prevent duplicate
    const existing = await Review.findOne({
      user: req.user._id,
      ...(sosId ? { sosId } : {}),
      ...(requestId ? { requestId } : {}),
      ...(!sosId && !requestId ? { team: teamId } : {}),
    });
    if (existing) {
      return res.status(400).json({ message: "You have already reviewed this rescue." });
    }

    const review = new Review({
      user: req.user._id,
      team: teamId,
      sosId: sosId || null,
      requestId: requestId || null,
      rating: Math.min(5, Math.max(1, Number(rating))),
      professionalism: professionalism ? Math.min(5, Math.max(1, Number(professionalism))) : 3,
      responseTime: responseTime || "moderate",
      comment: (comment || "").slice(0, 500),
    });

    await review.save();

    // Emit socket to admin
    const io = req.app.get("io");
    if (io) {
      io.to("admin_room").emit("new_review", {
        teamId,
        teamName: team.name,
        rating: review.rating,
        comment: review.comment,
        user: req.user.name,
      });
    }

    res.status(201).json({ success: true, message: "Review submitted. Thank you!", review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "You have already reviewed this rescue." });
    }
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/reviews/team/:teamId
 * Get all reviews for a specific team + aggregate stats.
 */
export const getTeamReviews = async (req, res) => {
  try {
    const { teamId } = req.params;
    const reviews = await Review.find({ team: teamId })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .limit(50);

    // Aggregate stats
    const stats = await Review.aggregate([
      { $match: { team: new mongoose.Types.ObjectId(teamId) } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          avgProfessionalism: { $avg: "$professionalism" },
          totalReviews: { $sum: 1 },
          fastCount: { $sum: { $cond: [{ $eq: ["$responseTime", "fast"] }, 1, 0] } },
          moderateCount: { $sum: { $cond: [{ $eq: ["$responseTime", "moderate"] }, 1, 0] } },
          slowCount: { $sum: { $cond: [{ $eq: ["$responseTime", "slow"] }, 1, 0] } },
        },
      },
    ]);

    res.json({
      reviews,
      stats: stats[0] || {
        avgRating: 0,
        avgProfessionalism: 0,
        totalReviews: 0,
        fastCount: 0,
        moderateCount: 0,
        slowCount: 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/reviews/mine
 * Get current user's submitted reviews.
 */
export const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate("team", "name specialization")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/reviews
 * Admin: get all reviews.
 */
export const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("user", "name")
      .populate("team", "name specialization")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

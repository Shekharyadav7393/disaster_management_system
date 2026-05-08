import Alert from "../models/Alert.js";
import ReliefCamp from "../models/ReliefCamp.js";
import User from "../models/User.js";
import Donation from "../models/Donation.js";
import { getPublicSettingsSnapshot } from "../services/settings.service.js";
import { optionalUser } from "../middleware/authMiddleware.js";
import {
  buildRequestPayload,
  createAutoAssignedRequest,
} from "../services/request.service.js";

/**
 * GET /api/public/stats
 */
export const getPublicStats = async (req, res) => {
  try {
    const [alerts, camps, volunteers, donations] = await Promise.all([
      Alert.countDocuments({ status: "active" }),
      ReliefCamp.countDocuments({ status: "ACTIVE" }),
      User.countDocuments({ role: "volunteer" }),
      Donation.find({ donationType: "MONEY", status: "verified" })
    ]);

    const donationTotal = donations.reduce((sum, d) => sum + (d.amount || 0), 0);

    res.json({
      alerts,
      camps,
      volunteers,
      donations: donationTotal
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/public/alerts
 */
export const getPublicAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ status: "active" }).sort({ createdAt: -1 }).limit(5);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/public/help-request
 */
export const createPublicHelpRequest = async (req, res) => {
  try {
    const user = await optionalUser(req);
    const io = req.app.get("io");
    const payload = buildRequestPayload({
      body: req.body,
      user,
    });

    if (!payload.description) {
      return res.status(400).json({ message: "Emergency description is required" });
    }

    const { request, dispatchInfo } = await createAutoAssignedRequest({
      payload,
      io,
      userId: user?._id,
    });

    if (io) {
      io.to("admin_room").emit("request_created", request);
      io.emit("stats.updated", { type: "request_created" });
    }

    res.status(201).json({
      success: true,
      message: dispatchInfo?.dispatched
        ? "Help request submitted. Rescue team assigned automatically."
        : "Help request submitted successfully. Awaiting team assignment.",
      request,
      assignedTeam: dispatchInfo?.team || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/public/settings
 */
export const getPublicSettings = async (_req, res) => {
  try {
    const settings = await getPublicSettingsSnapshot();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

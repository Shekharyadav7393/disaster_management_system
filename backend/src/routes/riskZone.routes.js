import express from "express";
import RiskZone from "../models/RiskZone.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/*
  CREATE RISK ZONE
  Admin creates a geographic prediction zone (polygon area).
*/
router.post("/", protect, async (req, res, next) => {
  try {
    const { name, type, riskLevel, boundary, polygon, code } = req.body;
    const geo = polygon || boundary;

    // ---- BASIC VALIDATION ----
    if (!name || !type || !riskLevel || !geo) {
      return res.status(400).json({
        message: "name, type, riskLevel and boundary/polygon are required",
      });
    }

    // GeoJSON validation
    if (
      geo.type !== "Polygon" ||
      !Array.isArray(geo.coordinates) ||
      geo.coordinates.length === 0
    ) {
      return res.status(400).json({
        message: "Invalid boundary format. Must be GeoJSON Polygon",
      });
    }

    // Create zone
    const zone = await RiskZone.create({
      name,
      type: type || "multi",
      riskLevel: String(riskLevel).toLowerCase(),
      boundary: geo,
      lastPredictedAt: new Date(),
    });

    res.status(201).json({
      message: "Risk zone created successfully",
      zone,
    });
  } catch (error) {
    next(error);
  }
});

/*
  GET ALL ZONES
  Used by dashboard map to display all monitored areas
*/
router.get("/", async (req, res, next) => {
  try {
    const zones = await RiskZone.find().sort({ createdAt: -1 });
    res.json(zones);
  } catch (error) {
    next(error);
  }
});

/*
  GET SINGLE ZONE
*/
router.get("/:id", async (req, res, next) => {
  try {
    const zone = await RiskZone.findById(req.params.id);
    if (!zone) return res.status(404).json({ message: "Risk zone not found" });
    res.json(zone);
  } catch (error) {
    next(error);
  }
});

/*
  UPDATE RISK ZONE
*/
router.put("/:id", protect, async (req, res, next) => {
  try {
    const { name, type, riskLevel, boundary, polygon } = req.body;
    const zone = await RiskZone.findById(req.params.id);
    if (!zone) return res.status(404).json({ message: "Risk zone not found" });

    if (name) zone.name = name;
    if (type) zone.type = type;
    if (riskLevel) zone.riskLevel = String(riskLevel).toLowerCase();
    if (boundary || polygon) zone.boundary = boundary || polygon;

    await zone.save();
    res.json({ message: "Risk zone updated successfully", zone });
  } catch (error) {
    next(error);
  }
});

/*
  DELETE RISK ZONE
*/
router.delete("/:id", protect, async (req, res, next) => {
  try {
    const zone = await RiskZone.findByIdAndDelete(req.params.id);
    if (!zone) return res.status(404).json({ message: "Risk zone not found" });
    res.json({ message: "Risk zone deleted successfully" });
  } catch (error) {
    next(error);
  }
});

export default router;

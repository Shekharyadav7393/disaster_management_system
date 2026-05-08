import SensorReading from "../models/SensorReading.js";
import RiskZone from "../models/RiskZone.js";
import DisasterAlert from "../models/DisasterAlert.js";
import Prediction from "../models/Prediction.js";
import { dispatchNearestTeamForAlert } from "./dispatch.service.js";
import { getSafetyInstructions } from "../utils/safetyInstructions.js";

// Simple, practical thresholds for a college demo.
// Adjust these values based on your local data and sensor calibration.
const THRESHOLDS = {
  rainfallMedium: 10, // mm (avg)
  rainfallHigh: 20, // mm (avg)
  waterMedium: 2.0, // meters (avg)
  waterHigh: 3.0, // meters (avg)
  rainRise: 5, // mm difference between recent vs previous window
  waterRise: 0.2, // meters difference between recent vs previous window
};

const LOOKBACK_MINUTES = 30;
const MAX_READINGS = 30;

const avg = (values) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

const computeTrend = (values, deltaThreshold) => {
  if (values.length < 6) return false;
  const recent = avg(values.slice(0, 3));
  const previous = avg(values.slice(3, 6));
  return recent - previous >= deltaThreshold;
};

const scoreToSeverity = (score) => {
  if (score >= 0.8) return "critical";
  if (score >= 0.6) return "high";
  if (score >= 0.3) return "medium";
  return "low";
};

const getTrendDirection = (recentAvg, previousAvg, deltaThreshold) => {
  if (recentAvg - previousAvg >= deltaThreshold) return "rising";
  if (previousAvg - recentAvg >= deltaThreshold) return "falling";
  return "stable";
};

export const analyzeFloodRisk = async ({ areaId, zoneId, sensorId, io }) => {
  const resolvedAreaId = areaId || zoneId;
  if (!resolvedAreaId) {
    return { severity: "low", alertCreated: false, reason: "area_missing" };
  }
  const since = new Date(Date.now() - LOOKBACK_MINUTES * 60 * 1000);

  const readings = await SensorReading.find({
    $or: [{ areaId: resolvedAreaId }, { zoneId: resolvedAreaId }],
    ts: { $gte: since },
  })
    .sort({ ts: -1 })
    .limit(MAX_READINGS)
    .lean();

  const rainfallValues = [];
  const waterValues = [];

  readings.forEach((r) => {
    if (typeof r.metrics?.rainfall === "number") {
      rainfallValues.push(r.metrics.rainfall);
    }
    if (typeof r.metrics?.waterLevel === "number") {
      waterValues.push(r.metrics.waterLevel);
    }
  });

  const rainfallAvg = avg(rainfallValues);
  const waterAvg = avg(waterValues);
  const rainRecent = avg(rainfallValues.slice(0, 3));
  const rainPrevious = avg(rainfallValues.slice(3, 6));
  const waterRecent = avg(waterValues.slice(0, 3));
  const waterPrevious = avg(waterValues.slice(3, 6));

  const rainRising = computeTrend(rainfallValues, THRESHOLDS.rainRise);
  const waterRising = computeTrend(waterValues, THRESHOLDS.waterRise);
  const risingTrend = rainRising || waterRising;
  const rainTrend = getTrendDirection(
    rainRecent,
    rainPrevious,
    THRESHOLDS.rainRise
  );
  const waterTrend = getTrendDirection(
    waterRecent,
    waterPrevious,
    THRESHOLDS.waterRise
  );
  const trendDirection =
    rainTrend === "rising" || waterTrend === "rising"
      ? "rising"
      : rainTrend === "falling" || waterTrend === "falling"
        ? "falling"
        : "stable";

  // Simple scoring to keep logic easy to defend in viva
  let score = 0;
  if (rainfallAvg >= THRESHOLDS.rainfallMedium) score += 0.3;
  if (rainfallAvg >= THRESHOLDS.rainfallHigh) score += 0.2;
  if (waterAvg >= THRESHOLDS.waterMedium) score += 0.3;
  if (waterAvg >= THRESHOLDS.waterHigh) score += 0.2;
  if (risingTrend) score += 0.2;

  const severity = scoreToSeverity(score);

  const zoneDoc = await RiskZone.findById(resolvedAreaId).lean();
  const riskLevel = severity.toUpperCase();

  await Prediction.create({
    zoneId: resolvedAreaId,
    predictedDisasterType: "flood",
    riskScore: Math.min(1, Math.max(0, score)),
    factors: {
      rainfallAvg,
      waterLevelAvg: waterAvg,
      trendDirection,
    }
  });

  // Update zone risk snapshot every time we evaluate
  // Store a small prediction history snapshot for analytics graphs.
  // We only keep the last 200 entries to avoid unbounded growth.
  await RiskZone.findByIdAndUpdate(
    resolvedAreaId,
    {
      riskLevel,
      lastPredictedAt: new Date(),
      currentRiskScore: Math.min(1, Math.max(0, score)),
      $push: {
        predictionHistory: {
          $each: [
            {
              ts: new Date(),
              riskScore: Math.min(1, Math.max(0, score)),
              // Store simple averages + trend to explain "why" the risk changed
              features: {
                rainfallAvg,
                waterLevelAvg: waterAvg,
                trendDirection,
              },
            },
          ],
          $slice: -200,
        },
      },
    },
    { new: false }
  );

  // LOW -> no alert
  if (severity === "low") {
    return { severity, alertCreated: false };
  }

  // Prevent duplicate alerts within 10 minutes for the same zone
  const recentAlert = await DisasterAlert.findOne({
    zoneId: resolvedAreaId,
    type: "flood",
    createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
  });

  if (recentAlert) {
    return { severity, alertCreated: false, duplicate: true };
  }

  const message = `Flood risk ${severity.toUpperCase()}: avg rainfall ${rainfallAvg.toFixed(
    1
  )}mm, avg water level ${waterAvg.toFixed(
    2
  )}m${risingTrend ? ", rising trend detected" : ""}.`;

  const { instructions, recommendedAction } = getSafetyInstructions("flood");

  const alert = await DisasterAlert.create({
    type: "flood",
    zoneId: resolvedAreaId,
    zoneName: zoneDoc?.name || "Unknown zone",
    sensorId,
    severity,
    message,
    title: "Flood Alert",
    description: message,
    status: "open",
    source: "prediction",
    instructions,
    recommendedAction,
  });

  if (io) {
    io.emit("alert.created", {
      id: alert._id,
      type: alert.type,
      zoneId: alert.zoneId,
      severity: alert.severity,
      message: alert.message,
      createdAt: alert.createdAt,
    });

    // Public broadcast event for citizen portal
    io.emit("alert.new", {
      zoneName: zoneDoc?.name || "Unknown zone",
      severity: alert.severity,
      message: alert.message,
      recommendedAction,
      timestamp: alert.createdAt,
    });
  }

  // Auto-dispatch rescue team for HIGH/CRITICAL alerts
  if (severity === "high" || severity === "critical") {
    try {
      await dispatchNearestTeamForAlert({ alert, io });
    } catch (dispatchError) {
      console.error("Dispatch error:", dispatchError);
    }
  }

  return { severity, alertCreated: true, alert };
};

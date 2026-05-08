import Team from "../models/Team.js";
import Mission from "../models/Mission.js";
import Alert from "../models/Alert.js";
import Notification from "../models/Notification.js";
import Sensor from "../models/Sensor.js";
import SensorReading from "../models/SensorReading.js";
import Timeline from "../models/Timeline.js";
import Zone from "../models/Zone.js";
import { getSafetyInstructions } from "../utils/safetyInstructions.js";
import {
  generateAIAlertMessage,
  predictEnvironmentDisaster,
} from "./ai.service.js";
import { fetchWeatherData, fetchSeismicData } from "./sensor.service.js";
import { normalizePointLocation } from "../utils/location.js";

/**
 * AI-Based Emergency Message Generator with fallback templates.
 */
export const getAIAlertMessage = async (
  type,
  severity,
  locationName = "",
  metrics = {}
) => {
  const aiMessage = await generateAIAlertMessage(
    type,
    severity,
    locationName,
    metrics
  );
  if (aiMessage) return aiMessage;

  const templates = {
    flood: {
      critical: `URGENT: Extreme water levels detected at ${locationName}. Immediate evacuation required! Seek higher ground now.`,
      high: `High flood risk detected at ${locationName}. River gauges have exceeded safe thresholds. Prepare for possible evacuation.`,
      medium: `Rising water levels at ${locationName}. Stay alert and monitor official channels.`,
      low: `Minor water accumulation at ${locationName}. Conditions are stable.`,
    },
    fire: {
      critical: `DANGER: Critical heat/gas readings at ${locationName}. Evacuate immediately!`,
      high: `Heavy smoke or extreme heat detected at ${locationName}. Evacuate the vicinity now.`,
      medium: `Abnormal heat signature detected at ${locationName}. Use caution.`,
      low: `Elevated temperature at ${locationName}. Monitor conditions.`,
    },
    gas: {
      critical: `TOXIC ALERT: Lethal gas levels at ${locationName}. Evacuate immediately.`,
      high: `Hazardous gas leak at ${locationName}. Seal the area and evacuate.`,
      medium: `Small gas leak at ${locationName}. Maintain distance.`,
      low: `Trace amounts of gas detected at ${locationName}.`,
    },
    earthquake: {
      critical: `MAJOR EARTHQUAKE near ${locationName}. Drop, Cover, and Hold on!`,
      high: `Significant earthquake reported. Check for structural damage.`,
      medium: `Minor tremors felt. Stay alert for official advisories.`,
      low: `Slight seismic activity detected. Conditions are stable.`,
    },
  };

  const category = templates[type] || templates.flood;
  return category[severity] || category.medium;
};

/**
 * Autonomous Rescue Dispatcher.
 * Automatically finds the nearest available team using MongoDB $near.
 */
export const autoDispatchRescueTeam = async (
  io,
  location, // GeoJSON Point object
  disasterType,
  severity,
  alertId,
  context = {}
) => {
  const { peopleCount = 1, message = "", userId = null } = context;
  const normalizedLocation = normalizePointLocation(location, location);
  
  console.log(`[AUTO-DISPATCH] Searching for teams for ${disasterType} alert. Scale: ${peopleCount} people...`);

  // 1. Find nearest AVAILABLE teams using MongoDB Geospatial query
  const teamsNeeded = Math.ceil(peopleCount / 5);
  
  const availableTeams = await Team.find({
    status: "AVAILABLE",
    currentLocation: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: normalizedLocation.coordinates
        },
        $maxDistance: 50000 // 50km radius
      }
    }
  }).limit(teamsNeeded);

  if (availableTeams.length === 0) {
    console.log("[AUTO-DISPATCH] No available teams found within 50km.");
    return null;
  }

  let finalPriority = severity.toUpperCase();
  if (peopleCount > 10) finalPriority = "ULTRA-CRITICAL";

  const dispatchedMissions = [];
  for (const team of availableTeams) {
    team.status = "DISPATCHED";
    await team.save();

    const mission = new Mission({
      title: `AUTO-MISSION: ${disasterType.toUpperCase()} Response`,
      description: `Autonomous emergency response for ${peopleCount} people. Trigger: ${alertId}. Message: "${message.slice(0, 50)}..."`,
      priority: finalPriority,
      status: "IN_PROGRESS",
      location: normalizedLocation,
      assignedTeam: team._id,
      peopleCount,
      disasterType
    });

    await mission.save();
    dispatchedMissions.push(mission);
    
    console.log(`[AUTO-DISPATCH] 🚐 Team "${team.name}" dispatched to mission ${mission._id}.`);

    // Notify the specific user if userId is provided
    if (io && userId) {
      io.to(`user_${userId}`).emit('team_dispatched', {
        teamName: team.name,
        memberCount: team.memberCount,
        members: team.memberNames,
        location: team.currentLocation,
        missionId: mission._id,
        eta: "10-15 minutes"
      });
    }
    
    // Also notify general guest room if no userId (best effort)
    if (io && !userId) {
      io.emit('guest_team_dispatched', {
        teamName: team.name,
        location: team.currentLocation
      });
    }
  }

  if (io) {
    io.to('admin_room').emit('AUTO_DISPATCH_EVENTS', { missions: dispatchedMissions });
    dispatchedMissions.forEach(m => {
      io.to('volunteer_room').emit('mission_created', m);
    });
  }

  return dispatchedMissions;
};


/**
 * Handle auto-generated alert from threshold detection.
 */
const handleAutoAlert = async (io, { type, severity, location, reasoning = "" }) => {
  const normalizedLocation = normalizePointLocation(location, location);
  const alert = new Alert({
    title: `AUTO-DETECT: ${type.toUpperCase()} Risk`,
    description: reasoning || "Automatic detection based on environmental sensor thresholds.",
    type,
    severity,
    status: "active",
    location: normalizedLocation,
    safetyInstructions: `Automated safety advice for ${type}.`,
    source: 'auto-ai'
  });

  await alert.save();
  
  if (io) {
    io.to('admin_room').emit("new_alert", alert);
  }
  return alert;
};

/**
 * Helper: Computes historical trends from sensor readings.
 */
const analyzeTrends = (readings, threshold) => {
  if (readings.length < 6) return { rising: false, stable: true };
  const values = readings.map(r => r.metrics?.waterLevel || 0);
  const recent = values.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  const previous = values.slice(3, 6).reduce((a, b) => a + b, 0) / 3;
  return {
    rising: recent - previous >= threshold,
    stable: Math.abs(recent - previous) < threshold
  };
};

/**
 * Automatic Detector & Responder (AI-Predictive).
 */
export const processAutomaticDetection = async (io, reading) => {
  const sensor = await Sensor.findOne({ deviceId: reading.deviceId });
  const locationName = sensor?.name || "Sensor Zone";

  // 1. Advanced Historical Analytics
  const since = new Date(Date.now() - 30 * 60 * 1000); 
  const pastReadings = await SensorReading.find({ deviceId: reading.deviceId, timestamp: { $gt: since } })
    .sort({ timestamp: -1 })
    .limit(20);
  
  const waterTrend = analyzeTrends(pastReadings, 5); 

  // 2. AI-Driven Prediction
  const prediction = await predictEnvironmentDisaster(reading.metrics);

  if (!prediction) {
    if (reading.metrics.waterLevel > 80 || (reading.metrics.waterLevel > 60 && waterTrend.rising)) {
      return handleAutoAlert(io, {
        type: "flood",
        severity: reading.metrics.waterLevel > 80 ? "high" : "medium",
        location: {
          address: sensor?.location?.address || locationName,
          lat: sensor?.location?.coordinates[1] || 28.61,
          lng: sensor?.location?.coordinates[0] || 77.2
        },
        reasoning: "Detected high water levels with a rising trend."
      });
    }
    return;
  }

  // 3. Predictive Actions
  if (prediction.isCritical || prediction.predictionScore > 75) {
    const oneHourAgo = new Date(Date.now() - 3600000);
    const recent = await Alert.findOne({
      type: prediction.predictedType,
      createdAt: { $gt: oneHourAgo }
    });

    if (!recent) {
      const alert = await handleAutoAlert(io, {
        type: prediction.predictedType,
        severity: prediction.severity,
        location: {
          address: locationName,
          lat: sensor?.location?.coordinates[1] || 28.6139,
          lng: sensor?.location?.coordinates[0] || 77.209
        },
        reasoning: `AI Prediction: ${prediction.reasoning} (ETA: ${prediction.timeframe})`
      });

      if (prediction.severity === "high" || prediction.severity === "critical") {
        await autoDispatchRescueTeam(
          io,
          alert.location,
          prediction.predictedType,
          prediction.severity,
          `PREDICT-${alert._id}`,
          { message: `PREEMPTIVE ACTION: ${prediction.reasoning}`, peopleCount: 1 }
        );
      }
    }
  }
};

/**
 * Automatic Real-World Sensor Sync.
 */
export const syncRealWorldSensors = async (io) => {

  const weather = await fetchWeatherData();
  if (weather) {
    const firstSensor = await Sensor.findOne();
    
    const reading = new SensorReading({
      deviceId: firstSensor?.deviceId || "sensor-auto-01",
      metrics: {
        waterLevel: weather.waterLevel,
        rainfall: weather.rainfall,
        temperature: weather.temperature,
        gasLevel: weather.rainfall * 5
      }
    });

    await reading.save();

    if (firstSensor) {
      firstSensor.metrics = reading.metrics;
      await firstSensor.save();
    }

    await processAutomaticDetection(io, reading);
  }

  const earthquake = await fetchSeismicData();
  if (earthquake && earthquake.magnitude > 4.5) {
    const oneHourAgo = new Date(Date.now() - 3600000);
    const recentQuake = await Alert.findOne({
      type: "earthquake",
      status: "active",
      createdAt: { $gt: oneHourAgo }
    });

    if (!recentQuake) {
      const severity = earthquake.magnitude > 6 ? "critical" : earthquake.magnitude > 5 ? "high" : "medium";
      const alert = new Alert({
        title: `SEISMIC ALERT: ${earthquake.magnitude} Mag Earthquake`,
        description: `Automatically detected near ${earthquake.place}.`,
        type: "earthquake",
        severity,
        status: "active",
        location: normalizePointLocation({
          lat: earthquake.coordinates.lat,
          lng: earthquake.coordinates.lng,
          address: earthquake.place,
        }),
        safetyInstructions: "Seek open ground. Avoid elevators.",
        source: 'auto-ai'
      });

      await alert.save();
      if (io) io.to('admin_room').emit("new_alert", alert);
    }
  }
};

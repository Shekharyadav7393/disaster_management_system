import RiskZone from "../models/RiskZone.js";
import SensorReading from "../models/SensorReading.js";
import DisasterAlert from "../models/DisasterAlert.js";
import User from "../models/User.js";
import { getSocketIO } from "../config/socket.js";
import { fetchWeatherData } from "./externalApiService.js";
import { triggerEmergencyBroadcast } from "./notificationService.js";

const VIBRATION_THRESHOLD = Number(process.env.VIBRATION_THRESHOLD || 2.5);
const ALERT_COOLDOWN_MINUTES = 10;

// Convert risk to status
const statusFromRisk = (riskLevel) => {
  const level = String(riskLevel).toLowerCase();
  if (level === "high" || level === "critical") return "unsafe";
  if (level === "medium") return "at_risk";
  return "safe";
};

// Evaluate combined risk (Sensors + Weather)
const evaluateRisk = (metrics, weather) => {
  const waterLevel = Number(metrics?.waterLevel ?? 0);
  const temperature = Number(metrics?.temperature ?? 0);
  const gas = Number(metrics?.gas ?? 0);
  const vibration = Number(metrics?.vibration ?? 0);

  // 1. Gas/Fire Risk
  if (gas > 400) {
    return { riskLevel: "high", disasterType: "gas", message: `Gas leak detected (${gas} ppm)` };
  }
  if (temperature > 55 && gas > 350) {
    return { riskLevel: "high", disasterType: "fire", message: `Fire risk: Temp ${temperature}°C Gas ${gas}ppm` };
  }

  // 2. Earthquake Risk
  if (vibration > VIBRATION_THRESHOLD) {
    return { riskLevel: "high", disasterType: "earthquake", message: `Abnormal ground vibration detected` };
  }

  // 3. Flood Risk (Sensor + Weather)
  if (waterLevel > 70) {
    return { riskLevel: "high", disasterType: "flood", message: `Flood danger: Water level ${waterLevel}` };
  }
  
  // 4. Real Weather Intelligence (Heatwave, Storm, Extreme Rain)
  if (weather) {
    if (weather.temp > 44) return { riskLevel: "critical", disasterType: "heatwave", message: `CRITICAL HEATWAVE: ${weather.temp}°C in ${weather.city}` };
    if (weather.temp > 40) return { riskLevel: "high", disasterType: "heatwave", message: `Heatwave Alert: ${weather.temp}°C in ${weather.city}` };
    if (weather.windSpeed > 60) return { riskLevel: "critical", disasterType: "cyclone", message: `CYCLONE ALERT: Wind speeds of ${weather.windSpeed} km/h` };
    if (weather.windSpeed > 45) return { riskLevel: "high", disasterType: "storm", message: `High Wind Alert: ${weather.windSpeed} km/h` };
    if (weather.warning?.includes("Flood") || weather.warning?.includes("Heavy Rainfall")) {
      return { riskLevel: "high", disasterType: "flood", message: `Environmental Flood Risk: ${weather.warning}` };
    }
  }

  if (waterLevel >= 40) {
    return { riskLevel: "medium", disasterType: "flood", message: `Water rising: ${waterLevel}` };
  }

  return { riskLevel: "low", disasterType: null, message: "RiskZone safe" };
};

// Prevent duplicate alerts
const shouldCreateAlert = async (areaId, disasterType) => {
  const since = new Date(Date.now() - ALERT_COOLDOWN_MINUTES * 60 * 1000);

  const recent = await DisasterAlert.findOne({
    zoneId: areaId,
    type: disasterType,
    createdAt: { $gte: since },
    status: "active",
  });

  return !recent;
};

export const runRiskEvaluation = async () => {
  console.log("Running risk evaluation cycle");

  try {
    const areas = await RiskZone.find();

    for (const area of areas) {
      // 1. Get real weather for the city
      const weather = await fetchWeatherData(area.city || "Delhi");

      // 2. Get latest sensor reading
      const reading = await SensorReading.findOne({
        $or: [{ areaId: area._id }, { zoneId: area._id }],
      }).sort({ ts: -1 });

      // 3. Evaluate risk
      const result = evaluateRisk(reading?.metrics || {}, weather);

      // 4. Log weather as a reading if it's new
      if (weather && (!reading || (Date.now() - new Date(reading.ts).getTime() > 10 * 60 * 1000))) {
        await SensorReading.create({
          zoneId: area._id,
          ts: new Date(),
          metrics: {
            temperature: weather.temp,
            windSpeed: weather.windSpeed,
            humidity: weather.humidity,
            vibration: reading?.metrics?.vibration || 0,
            waterLevel: reading?.metrics?.waterLevel || 0,
            gas: reading?.metrics?.gas || 0,
          },
          source: "weather_api",
        });
      }

      // 5. Update area risk
      const riskLevelFixed = result.riskLevel?.toUpperCase() || "LOW";
      await RiskZone.updateOne(
        { _id: area._id },
        {
          riskLevel: riskLevelFixed.toLowerCase(),
          status: statusFromRisk(result.riskLevel),
          lastUpdated: new Date(),
        }
      );

      // 6. Create alert if HIGH/CRITICAL
      if (riskLevelFixed === "HIGH" || riskLevelFixed === "CRITICAL") {
        const allow = await shouldCreateAlert(area._id, result.disasterType);
        if (!allow) continue;

        const createdAlert = await DisasterAlert.create({
          title: `${result.disasterType?.toUpperCase() || "EMERGENCY"} ALERT`,
          message: result.message,
          type: result.disasterType || "emergency",
          severity: riskLevelFixed === "CRITICAL" ? "critical" : "high",
          status: "active",
          zoneId: area._id,
          zoneName: area.name,
          source: "prediction",
        });

        const affectedUsers = await User.find({ "location.city": area.city || "Delhi" }).limit(500);
        await triggerEmergencyBroadcast({
          title: createdAlert.title,
          message: createdAlert.message,
          targetUsers: affectedUsers
        });

        // 🔥 SOCKET BROADCAST
        const io = getSocketIO();
        if (io) {
          io.emit("new_alert", {
            _id: createdAlert._id,
            disasterType: createdAlert.type,
            severity: createdAlert.severity,
            message: createdAlert.message,
            zone: {
              id: area._id,
              name: area.name,
              riskLevel: riskLevelFixed.toLowerCase(),
            },
            createdAt: createdAlert.createdAt,
          });

          io.emit("stats.updated", { type: "alert" });
          console.log(`🚨 ${createdAlert.type} alert broadcasted for ${area.name}`);
        }
      }
    }
  } catch (err) {
    console.error("Risk engine error:", err.message);
  }
};

// start scheduler
export default function startRiskEngine() {
  console.log("Risk engine started");
  setInterval(runRiskEvaluation, 60000); // Check every minute
}
import RescueTeam from "../models/RescueTeam.js";
import DispatchLog from "../models/DispatchLog.js";
import RiskZone from "../models/RiskZone.js";
import { haversineDistanceKm } from "../utils/haversine.js";

const AVERAGE_SPEED_KMH = 40;

const computeEtaMinutes = (distanceKm) =>
  Math.max(1, Math.round((distanceKm / AVERAGE_SPEED_KMH) * 60));

const computeZoneCenter = (zone) => {
  // Simple polygon center by averaging vertices.
  // This is sufficient for demo-level ETA and can be replaced with
  // a more precise centroid later.
  const coords = zone?.polygon?.coordinates?.[0] || [];
  if (!coords.length) return null;

  const sum = coords.reduce(
    (acc, [lng, lat]) => [acc[0] + lng, acc[1] + lat],
    [0, 0]
  );
  return [sum[0] / coords.length, sum[1] / coords.length];
};

export const dispatchNearestTeamForAlert = async ({ alert, io }) => {
  const zone = await RiskZone.findById(alert.zoneId).lean();
  const target = computeZoneCenter(zone);
  if (!target) return { dispatched: false, reason: "zone_center_missing" };

  // Find nearest available team using geo query
  const team = await RescueTeam.findOne({
    status: "AVAILABLE",
    currentLocation: {
      $near: {
        $geometry: { type: "Point", coordinates: target },
      },
    },
  });

  if (!team) return { dispatched: false, reason: "no_available_team" };

  const distanceKm = haversineDistanceKm(team.currentLocation.coordinates, target);
  const etaMinutes = computeEtaMinutes(distanceKm);

  team.status = "DISPATCHED";
  team.lastUpdatedAt = new Date();
  await team.save();

  const log = await DispatchLog.create({
    alertId: alert._id,
    zoneId: alert.zoneId,
    rescueTeamId: team._id,
    status: "DISPATCHED",
    etaMinutes,
    distanceKm,
    timeline: [{ status: "DISPATCHED", timestamp: new Date() }],
  });

  if (io) {
    io.emit("rescue.dispatched", {
      id: log._id,
      alertId: alert._id,
      zoneId: alert.zoneId,
      rescueTeamId: team._id,
      etaMinutes,
      distanceKm,
      status: "DISPATCHED",
    });
  }

  return { dispatched: true, log };
};

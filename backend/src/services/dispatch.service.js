import Team from "../models/Team.js";
import Zone from "../models/Zone.js";
import { haversineDistanceKm } from "../utils/haversine.js";

const AVERAGE_SPEED_KMH = 40;

const computeEtaMinutes = (distanceKm) =>
  Math.max(1, Math.round((distanceKm / AVERAGE_SPEED_KMH) * 60));

const computeZoneCenter = (zone) => {
  const coords = zone?.polygon?.coordinates?.[0] || zone?.coordinates || [];
  if (!coords.length) return null;

  const sum = coords.reduce(
    (acc, [lng, lat]) => [acc[0] + lng, acc[1] + lat],
    [0, 0]
  );
  return [sum[0] / coords.length, sum[1] / coords.length];
};

export const dispatchNearestTeamForAlert = async ({ alert, io }) => {
  const zone = await Zone.findById(alert.zoneId).lean();
  const target = computeZoneCenter(zone);
  if (!target) return { dispatched: false, reason: "zone_center_missing" };

  // Find nearest available team using geo query
  const team = await Team.findOne({
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

  if (io) {
    io.emit("rescue.dispatched", {
      alertId: alert._id,
      zoneId: alert.zoneId,
      rescueTeamId: team._id,
      etaMinutes,
      distanceKm,
      status: "DISPATCHED",
    });
  }

  return { dispatched: true, teamId: team._id, etaMinutes, distanceKm };
};

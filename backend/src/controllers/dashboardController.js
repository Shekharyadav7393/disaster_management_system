import Alert from "../models/Alert.js";
import SOS from "../models/SOS.js";
import Team from "../models/Team.js";
import User from "../models/User.js";
import ReliefCamp from "../models/ReliefCamp.js";
import Donation from "../models/Donation.js";
import Report from "../models/Report.js";
import Sensor from "../models/Sensor.js";
import SensorReading from "../models/SensorReading.js";
import { isVideoUrl } from "../services/media.service.js";
import { fetchSeismicData } from "../services/sensor.service.js";
import { getRealtimeWeather } from "../utils/weather.js";

/**
 * GET /api/dashboard/overview (Alias for getStats)
 */
export const getStats = async (req, res) => {
  try {
    const [
      activeAlerts,
      activeSOS,
      activeRescueTeams,
      totalVolunteers,
      totalReliefCamps,
      campCapacitySummary,
      verifiedDonations,
      totalReports
    ] = await Promise.all([
      Alert.countDocuments({ status: "active" }),
      SOS.countDocuments({ status: { $in: ["active", "acknowledged", "dispatched"] } }),
      Team.countDocuments({ status: { $ne: "INACTIVE" } }),
      User.countDocuments({ role: "volunteer" }),
      ReliefCamp.countDocuments(),
      ReliefCamp.aggregate([
        { $group: { _id: null, totalCapacity: { $sum: "$capacity" } } },
      ]),
      Donation.find({ donationType: "MONEY", status: "verified" }),
      Report.countDocuments({ status: "verified" })
    ]);

    const totalDonationsAmount = verifiedDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const totalCampCapacity = campCapacitySummary[0]?.totalCapacity || 0;

    res.json({
      activeAlerts,
      activeSOS,
      activeRescueTeams,
      totalVolunteers,
      totalReliefCamps,
      totalCampCapacity,
      totalDonationsAmount,
      totalReports
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOverview = getStats;

/**
 * GET /api/dashboard/donation-stats
 */
export const getDonationStats = async (req, res) => {
  try {
    const donations = await Donation.aggregate([
      { $match: { donationType: "MONEY", status: "verified" } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalAmount: { $sum: "$amount" },
          donationCount: { $sum: 1 }
      }},
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);
    res.json(donations.map((item) => ({
      date: item._id,
      totalAmount: item.totalAmount,
      donationCount: item.donationCount,
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/dashboard/rescue-status
 */
export const getRescueStatus = async (req, res) => {
  try {
    const statusCounts = await Team.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    // Transform to useful format
    const result = {
      AVAILABLE: 0,
      DISPATCHED: 0,
      INACTIVE: 0
    };
    
    statusCounts.forEach(s => {
      const key = s._id;
      if (result.hasOwnProperty(key)) result[key] = s.count;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/dashboard/recent-media
 */
export const getRecentMedia = async (req, res) => {
  try {
    const [reports, sos] = await Promise.all([
      Report.find({
        $or: [{ imageUrl: { $ne: "" } }, { videoUrl: { $ne: "" } }],
      })
        .sort({ createdAt: -1 })
        .limit(10),
      SOS.find({ media: { $exists: true, $ne: [] } })
        .populate("user", "name")
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    const media = [
      ...reports.map((report) => ({
        type: "report",
        imageUrl: report.imageUrl || "",
        videoUrl: report.videoUrl || "",
        title: report.title,
        createdAt: report.createdAt,
        user: report.reporterName || "Citizen",
        location: report.location,
      })),
      ...sos.flatMap((item) =>
        (item.media || []).map((url) => ({
          type: "sos",
          imageUrl: isVideoUrl(url) ? "" : url,
          videoUrl: isVideoUrl(url) ? url : "",
          title: item.message,
          createdAt: item.createdAt,
          user: item.user?.name || "Citizen",
          location: item.location,
        }))
      ),
    ]
      .filter((item) => item.imageUrl || item.videoUrl)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(media);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/dashboard/zone-risk
 */
export const getZoneRisk = async (req, res) => {
  try {
    const sensors = await Sensor.find().select('name location metrics');
    const risks = sensors.map(s => ({
      name: s.name,
      riskLevel: s.metrics?.waterLevel > 70 ? 'High' : s.metrics?.waterLevel > 40 ? 'Medium' : 'Low',
      value: s.metrics?.waterLevel || 0,
      score: Math.max(
        s.metrics?.waterLevel || 0,
        (s.metrics?.rainfall || 0) * 5,
        Math.min((s.metrics?.gasLevel || 0) / 2, 100)
      ),
      riskScore: Math.max(
        s.metrics?.waterLevel || 0,
        (s.metrics?.rainfall || 0) * 5,
        Math.min((s.metrics?.gasLevel || 0) / 2, 100)
      ),
      summary: `Water ${s.metrics?.waterLevel || 0}% | Rain ${s.metrics?.rainfall || 0} mm | Gas ${s.metrics?.gasLevel || 0} ppm`,
      location: s.location
    }));
    res.json(risks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/dashboard/external-summary
 */
export const getExternalSummary = async (req, res) => {
  try {
    const [reading, activeAlerts, latestEarthquake] = await Promise.all([
      SensorReading.findOne().sort({ createdAt: -1 }),
      Alert.find({ status: "active" }).sort({ createdAt: -1 }).limit(5),
      fetchSeismicData(),
    ]);

    const earthquakes = {
      india: [],
      global: [],
      source: "USGS",
    };

    if (latestEarthquake) {
      const quake = {
        magnitude: latestEarthquake.magnitude,
        place: latestEarthquake.place,
        date: latestEarthquake.time,
        depth: latestEarthquake.depth || 0,
      };

      earthquakes.global.push(quake);
      const { lat, lng } = latestEarthquake.coordinates || {};
      if (lat >= 8 && lat <= 37 && lng >= 68 && lng <= 97) {
        earthquakes.india.push(quake);
      }
    }

    let weatherData = null;
    try {
      weatherData = await getRealtimeWeather("New Delhi");
    } catch (err) {
      console.log("Weather API failed, using fallback:", err.message);
      weatherData = {
        temp: reading?.metrics?.temperature || 25,
        humidity: 60,
        windSpeed: 0,
        condition: reading?.metrics?.rainfall > 0 ? "Rainy" : "Clear",
        warning:
          reading?.metrics?.waterLevel > 80
            ? "River and drainage levels are elevated. Keep rescue resources ready."
            : "",
      };
    }

    res.json({
      weather: weatherData,
      threats: activeAlerts.map((alert) => ({
        type: alert.type,
        severity: alert.severity,
        detail: alert.message || alert.description || alert.title,
      })),
      earthquakes,
      disasters: activeAlerts.map((alert) => ({
        name: alert.title,
        type: alert.type,
        date: alert.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

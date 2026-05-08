import Alert from "../models/Alert.js";
import Report from "../models/Report.js";
import SOS from "../models/SOS.js";
import User from "../models/User.js";
import Resource from "../models/Resource.js";
import Task from "../models/Task.js";

/**
 * GET /api/analytics/summary
 */
export const getAnalyticsSummary = async (req, res) => {
  try {
    // 1. Report Type Distribution
    const typeDistribution = await Report.aggregate([
      { $group: { _id: "$disasterType", count: { $sum: 1 } } }
    ]);

    // 2. Severity Breakdown
    const severityBreakdown = await Report.aggregate([
      { $group: { _id: "$severity", count: { $sum: 1 } } }
    ]);

    // 3. Trends (Last 7 Days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const reportsTrend = await Report.aggregate([
      { $match: { createdAt: { $gt: sevenDaysAgo } } },
      { $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
          count: { $sum: 1 } 
      }},
      { $sort: { _id: 1 } }
    ]);

    // 4. Counts
    const [verifiedReports, volunteerCount, totalUsers, openSOS, resourceDistribution, taskStatus] = await Promise.all([
      Report.countDocuments({ status: "verified" }),
      User.countDocuments({ role: "volunteer" }),
      User.countDocuments(),
      SOS.countDocuments({ status: { $in: ["active", "acknowledged", "dispatched"] } }),
      Resource.aggregate([
        { $group: { _id: "$type", total: { $sum: "$quantity" } } },
        { $sort: { total: -1 } },
      ]),
      Task.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const stats = {
      verifiedReports,
      volunteerCount,
      totalUsers,
      openSOS,
    };

    res.json({
      typeDistribution,
      severityBreakdown,
      reportsTrend,
      resourceDistribution,
      taskStatus,
      stats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/analytics/regional
 */
export const getRegionalAnalytics = async (req, res) => {
  try {
    const regionalData = await Report.aggregate([
      { $group: {
          _id: "$location.city",
          count: { $sum: 1 },
          severitySum: { $sum: 1 } // Placeholder for actual severity weight
      }},
      { $sort: { count: -1 } }
    ]);
    res.json(regionalData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/analytics/heatmap
 */
export const getHeatmap = async (req, res) => {
  try {
    const [reports, sos, alerts] = await Promise.all([
      Report.find().select('location'),
      SOS.find().select('location'),
      Alert.find().select('location')
    ]);

    const points = [
      ...reports.map(r => ({ lat: r.location?.lat, lng: r.location?.lng, weight: 1 })),
      ...sos.map(s => ({ lat: s.location?.lat, lng: s.location?.lng, weight: 2 })),
      ...alerts.map(a => {
        const coords = a.location?.coordinates;
        if (Array.isArray(coords)) {
          return { lat: coords[1], lng: coords[0], weight: 3 };
        }
        return {
          lat: a.location?.coordinates?.lat || a.location?.lat,
          lng: a.location?.coordinates?.lng || a.location?.lng,
          weight: 3,
        };
      })
    ].filter(p => p.lat && p.lng);

    res.json(points);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

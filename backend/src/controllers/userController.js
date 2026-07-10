import User from "../models/User.js";
import Report from "../models/Report.js";
import SOS from "../models/SOS.js";
import Request from "../models/Request.js";
import { normalizePointLocation } from "../utils/location.js";
import {
  populateRequestQuery,
  serializeRequest,
} from "../services/request.service.js";

/**
 * GET /api/users
 */
export const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const query = role && role !== "all" ? { role } : {};
    const users = await User.find(query).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/users/profile
 */
export const getProfile = (req, res) => {
  const userObj = req.user.toObject();
  delete userObj.password;
  res.json(userObj);
};

/**
 * PATCH /api/users/me
 */
export const updateMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update allowed fields
    if (req.body.name) user.name = req.body.name;
    if (req.body.phone) user.phone = req.body.phone;
    if (req.body.location) {
      user.location = normalizePointLocation(req.body.location, user.location?.toObject?.() || user.location);
    }
    if (req.body.password) user.password = req.body.password; // Hash in real app!
    if (req.body.fcmToken !== undefined) user.fcmToken = req.body.fcmToken;

    await user.save();
    
    const userObj = user.toObject();
    delete userObj.password;
    res.json({ user: userObj });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * DELETE /api/users/:id
 */
export const deleteUser = async (req, res) => {
  try {
    if (req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Permission denied" });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/users
 */
export const createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const user = new User({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      password: String(password), // Note: In a real app, hash this!
      phone: phone || "",
      role: role || "citizen"
    });

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({
      message: "User created successfully",
      user: userObj
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PUT /api/users/:id
 */
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update allowed fields
    if (req.body.name) user.name = req.body.name;
    if (req.body.phone) user.phone = req.body.phone;
    if (req.body.location) {
      user.location = normalizePointLocation(req.body.location, user.location?.toObject?.() || user.location);
    }
    if (req.body.role) user.role = req.body.role;
    // Password change separate

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    res.json({ user: userObj });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PATCH /api/users/me/password
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.password !== currentPassword) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword; // Hash in real app
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/users/dashboard
 */
export const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const [user, reportsCount, sosCount, requests] = await Promise.all([
      User.findById(userId).select("-password"),
      Report.countDocuments({ userId }),
      SOS.countDocuments({ user: userId }),
      populateRequestQuery(Request.find({ userId }).sort({ createdAt: -1 }).limit(10)),
    ]);

    const serializedRequests = requests.map(serializeRequest);
    const requestStats = serializedRequests.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      },
      {
        total: 0,
        pending: 0,
        assigned: 0,
        resolved: 0,
        cancelled: 0,
      }
    );

    res.json({
      user,
      reportsCount,
      sosCount,
      requests: serializedRequests,
      requestStats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

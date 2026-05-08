import User from "../models/User.js";
import { signToken } from "../middleware/authMiddleware.js";

/**
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const user = new User({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      password: String(password), // Hashing is handled by User model pre-save hook
      phone: phone || "",
      role: role || "citizen"
    });

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({ 
      message: "Account created successfully", 
      user: userObj 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account has been banned for spreading misinformation." });
    }

    const userObj = user.toObject();
    delete userObj.password;

    res.json({
      token: signToken(user),
      user: userObj
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


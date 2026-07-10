import { createHmac } from "crypto";
import dotenv from "dotenv";

dotenv.config();

const TOKEN_SECRET = process.env.TOKEN_SECRET || "disasterms-local-secret";

/* ───────────── Token Utilities ───────────── */

import jwt from "jsonwebtoken";

export const signToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    TOKEN_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "15m" }
  );
};

export const signRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET || "disasterms-refresh-secret",
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d" }
  );
};

export const verifyToken = (token) => {
  if (!token) return null;

  try {
    // Attempt standard JWT verify first
    return jwt.verify(token, TOKEN_SECRET);
  } catch (error) {
    // If it fails, fallback to legacy crypto method for backward compatibility
    const parts = String(token).split(".");
    if (parts.length === 2) {
      const [payload, signature] = parts;
      const expected = createHmac("sha256", TOKEN_SECRET)
        .update(payload)
        .digest("base64url");
      if (expected === signature) {
        try {
          return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  }
};

/* ───────────── Middleware Functions ───────────── */

import User from "../models/User.js";

/**
 * Optional user extraction — returns the user object or null.
 * Does NOT reject the request if token is missing/invalid.
 */
export const optionalUser = async (req) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";
  const decoded = verifyToken(token);
  if (!decoded) return null;
  
  try {
    return await User.findById(decoded.id);
  } catch (error) {
    return null;
  }
};

/**
 * Auth guard — rejects the request with 401 if no valid token.
 */
export const protect = async (req, res, next) => {
  const user = await optionalUser(req);


  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  req.user = user;
  next();
};

/**
 * Role-based authorization — rejects with 403 if user's role is not in the allowed list.
 * Usage: authorizeRoles("super_admin", "admin")
 */
export const authorizeRoles = (...roles) => (req, res, next) => {
  const normalizedRoles = roles.map(r => String(r).toLowerCase());
  const userRole = String(req.user?.role || "").toLowerCase();

  // Mapping "super_admin" or similar mappings to "admin" if needed, 
  // but let's compare them directly to keep it simple and clean
  if (!req.user || !normalizedRoles.includes(userRole)) {
    return res
      .status(403)
      .json({ message: "You do not have permission for this action" });
  }
  next();
};

// Alias for backward compatibility with existing route files
export const authorize = authorizeRoles;

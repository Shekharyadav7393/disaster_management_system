import { createHmac } from "crypto";
import dotenv from "dotenv";

dotenv.config();

const TOKEN_SECRET = process.env.TOKEN_SECRET || "disasterms-local-secret";

/* ───────────── Token Utilities ───────────── */

export const signToken = (user) => {
  const payload = Buffer.from(
    JSON.stringify({ id: user._id, role: user.role })
  ).toString("base64url");
  const signature = createHmac("sha256", TOKEN_SECRET)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
};

export const verifyToken = (token) => {
  if (!token) return null;
  const [payload, signature] = String(token).split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", TOKEN_SECRET)
    .update(payload)
    .digest("base64url");
  if (expected !== signature) return null;
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
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
  if (!req.user || !roles.includes(req.user.role)) {


    return res
      .status(403)
      .json({ message: "You do not have permission for this action" });
  }
  next();
};

// Alias for backward compatibility with existing route files
export const authorize = authorizeRoles;

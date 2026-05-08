import express from "express";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  updateMyProfile,
  changePassword,
  getUserDashboard,
} from "../controllers/userController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// User self-service routes
router.get("/dashboard", protect, getUserDashboard);
router.patch("/me", protect, updateMyProfile);
router.patch("/me/password", protect, changePassword);

// Admin-only user management
router.get("/", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), getUsers);
router.post("/", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), createUser);
router.put("/:id", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), updateUser);
router.delete("/:id", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), deleteUser);

export default router;

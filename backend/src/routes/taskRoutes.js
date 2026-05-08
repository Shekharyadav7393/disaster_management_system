import express from "express";
import { getTasks, createTask, updateTask } from "../controllers/taskController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getTasks);
router.post("/", protect, authorizeRoles("super_admin", "emergency_admin", "admin"), createTask);
router.patch("/:id", protect, updateTask);

export default router;

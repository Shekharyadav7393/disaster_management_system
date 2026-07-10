import express from "express";
import { analyzeDamageImage, generateSOP } from "../controllers/aiController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import multer from "multer";
import { UPLOAD_DIR } from "../config/paths.js";

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, `ai-analysis-${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// Accessible to admins or emergency personnel to quickly analyze images
router.post(
    "/analyze-image",
    protect,
    upload.single("image"),
    analyzeDamageImage
);

// Admin workflow: Generate SOPs
router.post(
    "/generate-sop",
    protect,
    authorizeRoles("super_admin", "admin", "emergency_admin"),
    generateSOP
);

export default router;

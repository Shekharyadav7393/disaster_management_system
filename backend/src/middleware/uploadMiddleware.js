import multer from "multer";
import path from "path";
import { isCloudinaryConfigured } from "../config/cloudinary.js";
import { ensureUploadDir } from "../config/paths.js";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
]);

const fileFilter = (_req, file, cb) => {
  if (allowedMimeTypes.has(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new Error("Only images and videos are allowed"));
};

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, ensureUploadDir()),
  filename: (_req, file, cb) =>
    cb(
      null,
      `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(
        file.originalname
      )}`
    ),
});

const storage = isCloudinaryConfigured()
  ? multer.memoryStorage()
  : diskStorage;

export const mediaUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

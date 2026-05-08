import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const BACKEND_DIR = path.resolve(__dirname, "..", "..");
export const PROJECT_ROOT = path.resolve(BACKEND_DIR, "..");
export const FRONTEND_DIST_DIR = path.join(PROJECT_ROOT, "frontend", "dist");

const resolveConfiguredPath = (value, fallbackPath) => {
  if (!value) return fallbackPath;
  return path.isAbsolute(value) ? value : path.resolve(PROJECT_ROOT, value);
};

export const UPLOAD_DIR = resolveConfiguredPath(
  process.env.UPLOAD_DIR,
  path.join(BACKEND_DIR, "uploads")
);

export const ensureUploadDir = () => {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  return UPLOAD_DIR;
};

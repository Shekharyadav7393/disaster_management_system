import fs from "fs/promises";
import path from "path";
import { cloudinary, isCloudinaryConfigured } from "../config/cloudinary.js";
import { UPLOAD_DIR } from "../config/paths.js";

const trimString = (value = "") => String(value ?? "").trim();
const videoExtensionPattern = /\.(mp4|webm|ogg|mov|avi|mkv)$/i;
const cloudinaryFolder =
  trimString(process.env.CLOUDINARY_FOLDER) || "disaster-management-system";

export const isVideoUrl = (value = "") => videoExtensionPattern.test(value);

const buildCloudinaryPublicId = (prefix = "asset") =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const uploadBufferToCloudinary = (file, { folder, publicIdPrefix }) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: buildCloudinaryPublicId(publicIdPrefix),
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );

    uploadStream.end(file.buffer);
  });

const toLocalUploadUrl = (file) => {
  if (file?.filename) {
    return `/uploads/${file.filename}`;
  }

  if (file?.path) {
    return `/uploads/${path.basename(file.path)}`;
  }

  return "";
};

const getCloudinaryFolderForType = (type = "general") => {
  const sanitized = trimString(type).replace(/[^a-z0-9/_-]+/gi, "-");
  return `${cloudinaryFolder}/${sanitized || "general"}`;
};

export const storeUploadedFile = async (file, { type = "general" } = {}) => {
  if (!file) return "";

  if (isCloudinaryConfigured() && file.buffer) {
    const result = await uploadBufferToCloudinary(file, {
      folder: getCloudinaryFolderForType(type),
      publicIdPrefix: type,
    });
    return result?.secure_url || result?.url || "";
  }

  return toLocalUploadUrl(file);
};

export const storeUploadedFiles = async (files = [], options = {}) => {
  const stored = await Promise.all(
    files.filter(Boolean).map((file) => storeUploadedFile(file, options))
  );
  return stored.filter(Boolean);
};

const getLocalUploadPath = (mediaUrl = "") => {
  if (!mediaUrl.startsWith("/uploads/")) return "";
  return path.join(UPLOAD_DIR, path.basename(mediaUrl));
};

const stripFileExtension = (value = "") =>
  value.replace(/\.[^.]+$/, "");

const parseCloudinaryAsset = (mediaUrl = "") => {
  try {
    const parsed = new URL(mediaUrl);
    if (!parsed.hostname.includes("res.cloudinary.com")) {
      return null;
    }

    const parts = parsed.pathname.split("/").filter(Boolean);
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1 || uploadIndex < 1) {
      return null;
    }

    const resourceType = parts[uploadIndex - 1] || "image";
    const publicIdParts = parts.slice(uploadIndex + 1).filter(Boolean);

    while (publicIdParts.length && /^v\d+$/.test(publicIdParts[0])) {
      publicIdParts.shift();
    }

    if (!publicIdParts.length) {
      return null;
    }

    const lastIndex = publicIdParts.length - 1;
    publicIdParts[lastIndex] = stripFileExtension(publicIdParts[lastIndex]);

    return {
      publicId: publicIdParts.join("/"),
      resourceType,
    };
  } catch {
    return null;
  }
};

export const removeStoredMedia = async (mediaUrl = "") => {
  if (!mediaUrl) return;

  const cloudinaryAsset = parseCloudinaryAsset(mediaUrl);
  if (cloudinaryAsset && isCloudinaryConfigured()) {
    await cloudinary.uploader.destroy(cloudinaryAsset.publicId, {
      resource_type: cloudinaryAsset.resourceType || "image",
      invalidate: true,
    });
    return;
  }

  const localPath = getLocalUploadPath(mediaUrl);
  if (!localPath) return;

  try {
    await fs.unlink(localPath);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
};

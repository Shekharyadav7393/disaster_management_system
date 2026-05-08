import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const trimString = (value = "") => String(value ?? "").trim();

const cloudName = trimString(process.env.CLOUDINARY_CLOUD_NAME);
const apiKey = trimString(process.env.CLOUDINARY_API_KEY);
const apiSecret = trimString(process.env.CLOUDINARY_API_SECRET);

export const isCloudinaryConfigured = () =>
  Boolean(cloudName && apiKey && apiSecret);

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export { cloudinary };

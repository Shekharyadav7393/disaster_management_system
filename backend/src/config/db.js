import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const trimString = (value = "") => String(value ?? "").trim();

const resolveMongoUri = () => {
  const directUri = trimString(process.env.MONGO_URI);
  if (directUri) return directUri;

  const host = trimString(process.env.MONGO_HOST);
  if (!host) return "";

  const port = trimString(process.env.MONGO_PORT) || "27017";
  const databaseName =
    trimString(process.env.DB_NAME) || "disaster_management_system";
  const username = trimString(process.env.MONGO_USER);
  const password = trimString(process.env.MONGO_PASSWORD);
  const authSource = trimString(process.env.MONGO_AUTH_SOURCE);
  const credentials = username
    ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`
    : "";

  const query = authSource
    ? `?authSource=${encodeURIComponent(authSource)}`
    : "";

  return `mongodb://${credentials}${host}:${port}/${databaseName}${query}`;
};

const LOCAL_FALLBACK_URI = "mongodb://127.0.0.1:27017/disaster_management_system";

/**
 * Connects to MongoDB with fast timeout and environment-aware fallback.
 */
const connectDB = async () => {
  const mongoUri = resolveMongoUri();
  const options = {
    dbName: process.env.DB_NAME || 'disaster_management_system',
    serverSelectionTimeoutMS: 5000, // Fail fast (5s) instead of hanging 30s
  };

  if (mongoUri) {
    try {
      const conn = await mongoose.connect(mongoUri, options);
      console.log(`[DATABASE] MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`[DATABASE] Mongo Connection Error (${mongoUri.replace(/:([^@]+)@/, ':****@')}): ${error.message}`);
    }
  }

  // Only attempt localhost fallback in non-production environments
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    try {
      console.log(`[DATABASE] Attempting local fallback: ${LOCAL_FALLBACK_URI}`);
      const conn = await mongoose.connect(LOCAL_FALLBACK_URI, options);
      console.log(`[DATABASE] Local Fallback MongoDB Connected: ${conn.connection.host}`);
    } catch (fallbackError) {
      console.error(`[DATABASE] Local fallback connection failed: ${fallbackError.message}`);
    }
  }
};

export default connectDB;

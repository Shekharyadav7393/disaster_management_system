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
 * Connects to MongoDB using the URI from environment variables with fallback to local.
 */
const connectDB = async () => {
  const mongoUri = resolveMongoUri() || LOCAL_FALLBACK_URI;
  try {
    const conn = await mongoose.connect(mongoUri, {
      dbName: process.env.DB_NAME || 'disaster_management_system'
    });
    console.log(`[DATABASE] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[DATABASE] Primary Mongo Connection failed (${error.message}). Attempting local fallback...`);
    try {
      const conn = await mongoose.connect(LOCAL_FALLBACK_URI, {
        dbName: process.env.DB_NAME || 'disaster_management_system'
      });
      console.log(`[DATABASE] Local Fallback MongoDB Connected: ${conn.connection.host}`);
    } catch (fallbackError) {
      console.error(`[DATABASE] All MongoDB connection attempts failed: ${fallbackError.message}`);
      // Do not exit process immediately so server can run or provide clean error message
      throw fallbackError;
    }
  }
};

export default connectDB;

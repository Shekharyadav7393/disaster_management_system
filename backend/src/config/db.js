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

/**
 * Connects to MongoDB using the URI from environment variables.
 */
const connectDB = async () => {
  try {
    const mongoUri = resolveMongoUri();

    if (!mongoUri) {
      throw new Error(
        "MongoDB connection settings are missing. Set MONGO_URI or MONGO_HOST."
      );
    }

    const conn = await mongoose.connect(mongoUri, {
      dbName: process.env.DB_NAME || 'disaster_management_system'
    });
    console.log(`[DATABASE] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[DATABASE] MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

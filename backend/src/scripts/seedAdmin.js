import connectDB from "../config/db.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();

    const hashed = await bcrypt.hash("admin123", 10);

    await User.findOneAndUpdate(
      { email: "admin@disasterms.local" },
      {
        name: "System Admin",
        email: "admin@disasterms.local",
        password: hashed,
        role: "admin",
        phone: "+91 99999 00001",
        isActive: true,
        isVerified: true,
      },
      { upsert: true }
    );

    await User.findOneAndUpdate(
      { email: "admin@idmews.com" },
      {
        name: "System Admin",
        email: "admin@idmews.com",
        password: hashed,
        role: "admin",
        phone: "+91 99999 99999",
        isActive: true,
        isVerified: true,
      },
      { upsert: true }
    );

    console.log("Admins Ready: admin@disasterms.local / admin123 and admin@idmews.com / admin123");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
};

seedAdmin();
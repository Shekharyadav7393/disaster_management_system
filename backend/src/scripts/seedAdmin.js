import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const seedAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME,
  });

  const hashed = await bcrypt.hash("admin123", 10);

  await User.findOneAndUpdate(
    { email: "admin@idmews.com" },
    {
      name: "System Admin",
      email: "admin@idmews.com",
      password: hashed,
      role: "admin",
      phone: "9999999999",
      isActive: true,
    },
    { upsert: true }
  );

  console.log("Admin Ready: admin@idmews.com / admin123");
  process.exit();
};

seedAdmin();
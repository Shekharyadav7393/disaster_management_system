import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import DisasterType from '../models/DisasterType.js';
import Team from '../models/Team.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("[SEED] Connected to MongoDB for seeding...");

    // 1. Seed Roles/Users
    const admin = await User.findOne({ email: "admin@disasterms.local" });
    if (!admin) {
      await User.create({
        name: "Control Room Admin",
        email: "admin@disasterms.local",
        password: "admin123", // Real app uses hashing!
        role: "super_admin",
        phone: "+91 99999 00001",
        location: { city: "Delhi", state: "Delhi" }
      });
      console.log("[SEED] Admin user created.");
    }

    // 2. Seed Disaster Types
    const types = ["flood", "earthquake", "fire", "cyclone", "landslide", "gas", "drought", "other"];
    for (const name of types) {
      const existing = await DisasterType.findOne({ name });
      if (!existing) {
        await DisasterType.create({
          name,
          value: name,
          label: name.charAt(0).toUpperCase() + name.slice(1)
        });
      }
    }
    console.log("[SEED] Disaster types seeded.");

    // 3. Seed initial Team
    const team = await Team.findOne({ name: "Alpha Rescue 1" });
    if (!team) {
      await Team.create({
        name: "Alpha Rescue 1",
        capacity: 8,
        status: "AVAILABLE",
        currentLocation: {
          type: "Point",
          coordinates: [77.2167, 28.6448] // Delhi
        }
      });
      console.log("[SEED] Initial team created.");
    }

    console.log("[SEED] Seeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error(`[SEED] Seeding error: ${error.message}`);
    process.exit(1);
  }
};

seedData();

import connectDB from "../config/db.js";
import User from "../models/User.js";
import Team from "../models/Team.js";
import Alert from "../models/Alert.js";
import Report from "../models/Report.js";
import Mission from "../models/Mission.js";
import Task from "../models/Task.js";
import SOS from "../models/SOS.js";
import ReliefCamp from "../models/ReliefCamp.js";
import Zone from "../models/Zone.js";
import dotenv from "dotenv";

dotenv.config();

const setupGenuineAdmin = async () => {
  try {
    console.log("[SETUP] Connecting to MongoDB...");
    await connectDB();

    console.log("[SETUP] Removing dummy/seed data...");
    await User.deleteMany({ email: { $ne: "ahirshekhar7393@gmail.com" } });
    await Team.deleteMany({});
    await Alert.deleteMany({});
    await Report.deleteMany({});
    await Mission.deleteMany({});
    await Task.deleteMany({});
    await SOS.deleteMany({});
    await ReliefCamp.deleteMany({});
    await Zone.deleteMany({});

    console.log("[SETUP] Setting up genuine Admin account...");
    const adminEmail = "ahirshekhar7393@gmail.com";
    const rawPassword = "sandeepy00@@";

    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = new User({
        name: "Shekhar Yadav",
        email: adminEmail,
        password: rawPassword,
        phone: "+91 73930 00000",
        role: "admin",
        isVerified: true,
        isActive: true,
        authProvider: "local",
      });
      await admin.save();
      console.log("[SETUP] ✅ Genuine Admin created successfully!");
    } else {
      admin.name = "Shekhar Yadav";
      admin.password = rawPassword;
      admin.role = "admin";
      admin.isVerified = true;
      admin.isActive = true;
      await admin.save();
      console.log("[SETUP] ✅ Genuine Admin updated successfully!");
    }

    console.log("[SETUP] Complete! Database is clean and ready for real organic user data.");
    process.exit(0);
  } catch (error) {
    console.error("[SETUP] Error:", error);
    process.exit(1);
  }
};

setupGenuineAdmin();

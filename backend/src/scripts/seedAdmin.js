import connectDB from "../config/db.js";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();

    let admin = await User.findOne({ email: "ahirshekhar7393@gmail.com" });
    if (!admin) {
      admin = new User({
        name: "Shekhar Yadav",
        email: "ahirshekhar7393@gmail.com",
        password: "sandeepy00@@",
        role: "admin",
        phone: "+91 73930 00000",
        isActive: true,
        isVerified: true,
        authProvider: "local",
      });
      await admin.save();
    } else {
      admin.password = "sandeepy00@@";
      admin.role = "admin";
      admin.isActive = true;
      admin.isVerified = true;
      await admin.save();
    }

    console.log("Genuine Admin Ready: ahirshekhar7393@gmail.com");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
};

seedAdmin();
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import http from "http";
import morgan from "morgan";
import path from "path";
import { Server as SocketIOServer } from "socket.io";
import cron from "node-cron";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "url";

// --- Configuration & Helpers ---
const __filename = fileURLToPath(import.meta.url);

import connectDB from "./config/db.js";
import { ensureUploadDir, FRONTEND_DIST_DIR, UPLOAD_DIR } from "./config/paths.js";
import mongoose from "mongoose";
import { protect, authorizeRoles, optionalUser, verifyToken } from "./middleware/authMiddleware.js";
import { syncRealWorldSensors } from "./services/autonomousEngine.js";

// --- Routes ---
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import alertRoutes, { timelineRouter } from "./routes/alertRoutes.js";
import zoneRoutes from "./routes/zoneRoutes.js";
import reliefCampRoutes, { resourceRouter } from "./routes/reliefCampRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import missionRoutes from "./routes/missionRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import volunteerRoutes from "./routes/volunteerRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import sosRoutes from "./routes/sosRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import donationRoutes from "./routes/donationRoutes.js";
import dashboardRoutes, { externalRouter } from "./routes/dashboardRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import sensorRoutes from "./routes/sensorRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import disasterTypeRoutes from "./routes/disasterTypeRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import User from "./models/User.js";

dotenv.config();

const DEFAULT_CORS_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://disaster-management-system-1-a2bz.onrender.com",
];

const corsOrigins = [
  ...new Set(
    [
      ...DEFAULT_CORS_ORIGINS,
      ...(process.env.CORS_ORIGINS || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ]
  ),
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

// Rate limiting for SOS (relaxed for testing)
const sosRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, 
  max: 20, 
  message: { message: "Too many SOS requests from this IP, please try again after 5 minutes" }
});


/* ───────────── App Factory ───────────── */

const createApp = () => {
  const app = express();
  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
  });
  const hasFrontendBuild = fs.existsSync(FRONTEND_DIST_DIR);

  ensureUploadDir();

  // Attach io to app for controllers/middleware to access
  app.set("io", io);

  /* ── Global Middleware ── */
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  // app.use(morgan("dev"));
  app.use("/uploads", express.static(UPLOAD_DIR));
  if (hasFrontendBuild) {
    app.use(express.static(FRONTEND_DIST_DIR));
  }

  /* ── Socket.IO ── */
  io.on("connection", async (socket) => {
    console.log(`[SOCKET] User connected: ${socket.id}`);
    
    // Auth-based Room Assignment
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    const decoded = verifyToken(token);
    
    if (decoded) {
      // Personal Room
      socket.join(`user_${decoded.id}`);
      
      // Role-based Rooms
      if (['admin', 'super_admin', 'emergency_admin'].includes(decoded.role)) {
        socket.join('admin_room');
        console.log(`[SOCKET] ${socket.id} joined admin_room (role: ${decoded.role})`);
      } else if (decoded.role === 'volunteer' || decoded.role === 'rescue') {
        socket.join('volunteer_room');
        console.log(`[SOCKET] ${socket.id} joined volunteer_room`);
      }
    }

    socket.on("join_team", (teamId) => {
      socket.join(`team_${teamId}`);
    });

    socket.on("location_update", (data) => {
      // Broadcast to relevant rooms or specific team
      io.emit("team_location_update", data);
    });

    socket.on("disconnect", () => {
      console.log(`[SOCKET] User disconnected: ${socket.id}`);
    });
  });

  /* ── Health Check ── */
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", message: "Disaster Management API running" });
  });

  /* ── Mount Routes ── */
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/alerts", alertRoutes);
  app.use("/api/timeline", timelineRouter);
  app.use("/api/zones", zoneRoutes);
  app.use("/api/relief-camps", reliefCampRoutes);
  app.use("/api/resources", resourceRouter);
  app.use("/api/teams", teamRoutes);
  app.use("/api/missions", missionRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/volunteers", volunteerRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/sos", sosRateLimiter, sosRoutes); // Apply rate limiting
  app.use("/api/notifications", notificationRoutes);
  app.use("/api", donationRoutes);           
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/external", externalRouter);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/sensors", sensorRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/public", publicRoutes);
  app.use("/api/disaster-types", disasterTypeRoutes);
  app.use("/api/requests", requestRoutes);
  app.use("/api/reviews", reviewRoutes);

  if (hasFrontendBuild) {
    app.get("*", (req, res, next) => {
      if (
        req.path.startsWith("/api") ||
        req.path.startsWith("/uploads") ||
        req.path.startsWith("/socket.io") ||
        path.extname(req.path)
      ) {
        return next();
      }

      return res.sendFile(path.join(FRONTEND_DIST_DIR, "index.html"));
    });
  }

  /* ── Admin Sensor Sync Endpoint ── */
  app.post(
    "/api/admin/sensors/sync",
    protect,
    authorizeRoles("super_admin", "admin"),
    async (_req, res) => {
      try {
        await syncRealWorldSensors(io);
        res.json({
          message: "Real-world sensors synchronized successfully",
          status: "success",
        });
      } catch (error) {
        res
          .status(500)
          .json({ message: "Sensor sync failed", error: error.message });
      }
    }
  );

  /* ── Cron: Auto Sync Every 10 Minutes ── */
  const syncTask = cron.schedule("*/10 * * * *", () => {
    syncRealWorldSensors(io).catch((err) =>
      console.error("[CRON] Sensor Sync Error:", err)
    );
  });

  /* ── Global Error Handler ── */
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ message: err.message || "Server error" });
  });

  return {
    app,
    server,
    io,
    close: async () => {
      syncTask.stop();
      await new Promise((resolve) => {
        io.close(() => server.close(resolve));
      });
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
    },
  };
};

/* ───────────── Start Server ───────────── */

export const startServer = async (options = {}) => {
  if (options.mongoUri) {
    process.env.MONGO_URI = options.mongoUri;
  }
  await connectDB();

  if (options.seedFresh) {
    console.log("[SEEDING] Clearing database and seeding fresh admin...");
    await mongoose.connection.db.dropDatabase();
    await User.create({
      name: "Super Admin",
      email: "admin@disasterms.local",
      password: "admin123",
      role: "admin",
      phone: "+91 00000 00000",
      isVerified: true
    });
  }
  
  const instance = createApp();
  const port = options.port !== undefined ? options.port : (parseInt(process.env.PORT) || 5000);
  await new Promise((resolve, reject) => {
    instance.server.once('error', reject);
    instance.server.listen(port, () => {
      instance.server.removeListener('error', reject);
      resolve();
    });
  });
  return {
    ...instance,
    port: instance.server.address().port,
  };
};

const isEntryPoint = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isEntryPoint) {
  startServer().then(({ port }) => {
    console.log(`Server running on port ${port}`);
  });
}

export default createApp;

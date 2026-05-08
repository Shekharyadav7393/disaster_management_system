import SOS from "../models/SOS.js";
import Alert from "../models/Alert.js";
import { processAutoResponse } from "../services/aiResponder.js";
import { autoDispatchService } from "../services/autoDispatch.service.js";
import {
  notifySosReceived,
  notifyTeamDispatched,
  notifyStatusChanged,
  notifyResolvedWithReviewPrompt,
} from "../services/notificationService.js";
import {
  isVideoUrl,
  removeStoredMedia,
  storeUploadedFiles,
} from "../services/media.service.js";

const toSerializableSOS = (record) => {
  const item = record?.toObject ? record.toObject() : record;
  if (!item) return null;

  const coordinates = item.location?.coordinates || [];
  const lng = Number(coordinates[0] ?? item.location?.lng ?? 0);
  const lat = Number(coordinates[1] ?? item.location?.lat ?? 0);
  const media = Array.isArray(item.media) ? item.media : [];
  const videoUrl = media.find((entry) => isVideoUrl(entry)) || "";
  const imageUrl = media.find((entry) => !isVideoUrl(entry)) || "";

  return {
    ...item,
    location: {
      ...item.location,
      lat,
      lng,
    },
    media,
    imageUrl,
    videoUrl,
  };
};

/**
 * GET /api/sos/mine
 */
export const getMySOS = async (req, res) => {
  try {
    const items = await SOS.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(items.map(toSerializableSOS));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/sos
 */
export const getAllSOS = async (req, res) => {
  try {
    const status = req.query.status;
    const query = status && status !== "all" ? { status } : {};
    const items = await SOS.find(query).populate('user', 'name phone').sort({ createdAt: -1 });
    res.json(items.map(toSerializableSOS));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/sos
 * 
 * Full Flow:
 *  1. AI analyzes message → detects intent + priority
 *  2. SOS saved to MongoDB
 *  3. Socket events sent (auto_reply, sos_alert)
 *  4. autoDispatchService finds nearest team → marks DISPATCHED
 *  5. Auto-notifications created in DB
 *  6. HTTP response includes: AI response + team details + ETA
 */
export const sendSOS = async (req, res) => {
  try {
    const io = req.app.get("io");
    const { message, lat, lng, address, peopleCount } = req.body;
    const files = req.files || {};
    
    // ──── 1. AI Auto-Responder ────
    const aiResult = await processAutoResponse(message, { lat, lng });

    // ──── 2. Map media URLs ────
    const media = [
      ...(await storeUploadedFiles(files.image || [], { type: "sos/images" })),
      ...(await storeUploadedFiles(files.video || [], { type: "sos/videos" })),
    ];

    // ──── 3. Create SOS Record ────
    const sos = new SOS({
      user: req.user?._id,
      message: message || "SOS Emergency!",
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng) || 0, parseFloat(lat) || 0],
        address: address || ""
      },
      peopleCount: parseInt(peopleCount) || 1,
      emergencyType: aiResult.intent.toLowerCase(),
      status: aiResult.isSpam ? 'spam' : 'active',
      spamScore: aiResult.spamScore,
      aiDetectedIntent: aiResult.intent,
      autoReplySent: true,
      media
    });

    await sos.save();

    if (aiResult.isSpam) {
      if (req.user?._id) {
        import("../models/User.js").then(({ default: User }) => {
          User.findByIdAndUpdate(req.user._id, { isBlocked: true, trustScore: 0 }).exec();
        }).catch(err => console.error("Error updating user block status:", err));
      }
    }

    // ──── 4. Real-Time: AI Reply ────
    if (io) {
      if (req.user) {
        io.to(`user_${req.user._id}`).emit('auto_reply', {
          message: aiResult.response,
          sosId: sos._id,
          intent: aiResult.intent,
          priority: aiResult.priority
        });
      }
      if (!aiResult.isSpam) {
        const serializableSOS = toSerializableSOS(sos);
        io.to('admin_room').emit('sos_alert', serializableSOS);
        io.to('volunteer_room').emit('nearby_sos', serializableSOS);
      }
    }

    // ──── 5. AUTO-NOTIFICATIONS: SOS Received ────
    if (!aiResult.isSpam) {
      await notifySosReceived(io, {
        userName: req.user?.name || "Unknown",
        emergencyType: sos.emergencyType,
        sosId: sos._id,
      });
    }

    // ──── 6. AUTO-DISPATCH (the main fix) ────
    let dispatchInfo = null;
    if (!aiResult.isSpam) {
      // Create alert for high/critical
      if (aiResult.priority === 'critical' || aiResult.priority === 'high') {
        try {
          const alert = new Alert({
            title: `AI-DETECTED SOS: ${aiResult.intent}`,
            type: aiResult.intent,
            severity: aiResult.priority,
            location: sos.location,
            description: `Automated alert for SOS: ${message}`,
            safetyInstructions: aiResult.response,
            source: 'auto-ai'
          });
          await alert.save();
          if (io) {
            io.to('admin_room').emit('new_alert', alert);
            io.to('admin_room').emit('NEW_ALERT', alert);
          }
        } catch (alertErr) {
          console.error("[SOS] Alert creation error (non-fatal):", alertErr.message);
        }
      }

      // ** THE KEY CALL — auto-dispatch nearest team **
      try {
        dispatchInfo = await autoDispatchService({
          userLocation: sos.location,
          emergencyType: sos.emergencyType,
          peopleCount: sos.peopleCount,
          sosId: sos._id,
          io,
          userId: req.user?._id,
        });

        // Update SOS status to 'dispatched' if team was found
        if (dispatchInfo?.dispatched) {
          sos.status = 'dispatched';
          sos.dispatch = {
            teamId: dispatchInfo.teamId,
            teamName: dispatchInfo.team.name,
            memberCount: dispatchInfo.team.memberCount,
            members: dispatchInfo.team.members,
            memberPhones: dispatchInfo.team.memberPhones,
            leadPhone: dispatchInfo.team.leadPhone,
            eta: dispatchInfo.eta,
            distance: dispatchInfo.distance,
            status: dispatchInfo.team.status,
            autoGenerated: dispatchInfo.team.autoGenerated,
            lastUpdatedAt: new Date(),
          };
          await sos.save();

          // ──── AUTO-NOTIFICATION: Team Dispatched ────
          if (req.user?._id) {
            await notifyTeamDispatched(io, {
              userId: req.user._id,
              teamName: dispatchInfo.team.name,
              eta: dispatchInfo.eta,
              memberCount: dispatchInfo.team.memberCount,
            });
          }
        }
      } catch (dispatchErr) {
        console.error("[SOS] Dispatch error (non-fatal):", dispatchErr.message);
      }
    }

    // ──── 7. Build final HTTP response ────
    const responseData = {
      success: true,
      message: aiResult.isSpam
        ? "SOS flagged for review."
        : dispatchInfo?.dispatched
          ? "SOS Received. Nearest rescue team dispatched automatically."
          : "SOS received and processed. Awaiting team assignment.",
      aiResponse: aiResult.response,
      sos: toSerializableSOS(sos),
    };

    // Attach dispatched team info directly in HTTP response
    if (dispatchInfo?.dispatched) {
      responseData.dispatchedTeam = dispatchInfo.team;
      responseData.estimatedArrival = dispatchInfo.eta;
      responseData.distance = dispatchInfo.distance;
      responseData.sos = toSerializableSOS(sos);
    }

    res.status(201).json(responseData);

  } catch (error) {
    console.error("[SOS_CONTROLLER] Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * PATCH /api/sos/:id/status
 */
export const updateSOSStatus = async (req, res) => {
  try {
    const io = req.app.get("io");
    const sos = await SOS.findById(req.params.id);
    if (!sos) return res.status(404).json({ message: "SOS record not found" });

    const oldStatus = sos.status;
    sos.status = req.body.status;
    await sos.save();

    // ──── AUTO-NOTIFICATION: Status Changed ────
    if (sos.user) {
      await notifyStatusChanged(io, {
        userId: sos.user,
        recordType: "SOS",
        status: sos.status,
        recordId: sos._id,
      });

      // If resolved and team was dispatched → prompt review
      if (sos.status === "resolved" && sos.dispatch?.teamName) {
        await notifyResolvedWithReviewPrompt(io, {
          userId: sos.user,
          teamName: sos.dispatch.teamName,
          recordType: "SOS",
          recordId: sos._id,
        });
      }
    }

    // Socket events
    if (io) {
      if (sos.user) {
        io.to(`user_${sos.user}`).emit("sos_status_updated", {
          sosId: sos._id,
          status: sos.status,
        });
      }
      io.to("admin_room").emit("sos_status_updated", {
        sosId: sos._id,
        status: sos.status,
      });
    }

    res.json(toSerializableSOS(sos));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PATCH /api/sos/:id/verify-spam
 */
export const verifySOSSpam = async (req, res) => {
  try {
    const sos = await SOS.findByIdAndUpdate(
      req.params.id,
      { spamScore: 0, status: "active" },
      { new: true }
    );
    if (!sos) return res.status(404).json({ message: "SOS record not found" });
    res.json(toSerializableSOS(sos));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * DELETE /api/sos/:id/media
 */
export const deleteSOSMedia = async (req, res) => {
  try {
    const existing = await SOS.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "SOS record not found" });

    await Promise.all(
      (existing.media || []).map((mediaUrl) => removeStoredMedia(mediaUrl))
    );

    const sos = await SOS.findByIdAndUpdate(
      req.params.id,
      { media: [] },
      { new: true }
    );
    res.json({ message: "SOS media removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

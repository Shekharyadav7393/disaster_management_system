import Request from "../models/Request.js";
import Team from "../models/Team.js";
import {
  buildRequestPayload,
  createAutoAssignedRequest,
  manuallyAssignRequestTeam,
  populateRequestQuery,
  releaseAssignedTeamIfNeeded,
  serializeRequest,
} from "../services/request.service.js";
import {
  notifyRequestCreated,
  notifyTeamAssigned,
  notifyStatusChanged,
  notifyResolvedWithReviewPrompt,
} from "../services/notificationService.js";

/**
 * GET /api/requests
 */
export const getRequests = async (req, res) => {
  try {
    const status = req.query.status;
    const query = status && status !== "all" ? { status } : {};
    const items = await populateRequestQuery(
      Request.find(query).sort({ createdAt: -1 })
    );
    res.json(items.map(serializeRequest));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/requests
 */
export const createRequest = async (req, res) => {
  try {
    const io = req.app.get("io");
    const payload = buildRequestPayload({ body: req.body, user: req.user });

    if (!payload.description) {
      return res.status(400).json({ message: "Emergency description is required" });
    }

    const { request, dispatchInfo } = await createAutoAssignedRequest({
      payload,
      io,
      userId: req.user?._id,
    });

    if (io) {
      io.to("admin_room").emit("request_created", request);
      io.emit("stats.updated", { type: "request_created" });
    }

    // ──── AUTO-NOTIFICATION: Request Created ────
    await notifyRequestCreated(io, {
      userName: req.user?.name || payload.name || "Unknown",
      emergencyType: payload.emergencyType,
      description: payload.description,
    });

    // ──── AUTO-NOTIFICATION: Team Auto-Assigned ────
    if (dispatchInfo?.dispatched && req.user?._id) {
      await notifyTeamAssigned(io, {
        userId: req.user._id,
        teamName: dispatchInfo.team?.name || "Rescue Team",
        eta: dispatchInfo.eta || "",
        memberCount: dispatchInfo.team?.memberCount || 0,
      });
    }

    res.status(201).json({
      success: true,
      message: dispatchInfo?.dispatched
        ? "Emergency request created and rescue team assigned automatically."
        : "Emergency request created. Awaiting team assignment.",
      request,
      assignedTeam: dispatchInfo?.team || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PATCH /api/requests/:id
 */
export const updateRequest = async (req, res) => {
  try {
    const item = await Request.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Request not found" });

    const payload = buildRequestPayload({
      body: {
        name: req.body.name ?? item.name,
        phone: req.body.phone ?? item.phone,
        peopleCount: req.body.peopleCount ?? item.peopleCount,
        description: req.body.description ?? req.body.message ?? item.description,
        priority: req.body.priority ?? item.priority,
        emergencyType: req.body.emergencyType ?? req.body.type ?? item.emergencyType,
        location: {
          ...(item.location?.toObject?.() || item.location || {}),
          ...(req.body.location || {}),
          lat: req.body.location?.lat ?? req.body.lat ?? item.location?.lat,
          lng: req.body.location?.lng ?? req.body.lng ?? item.location?.lng,
        },
      },
    });

    item.name = payload.name || item.name;
    item.phone = payload.phone || item.phone;
    item.peopleCount = payload.peopleCount;
    item.description = payload.description || item.description;
    item.priority = payload.priority;
    item.emergencyType = payload.emergencyType;
    item.location = payload.location;

    await item.save();

    const hydrated = await populateRequestQuery(Request.findById(item._id));
    res.json(serializeRequest(hydrated));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PUT /api/requests/:id/assign-team
 */
export const assignTeam = async (req, res) => {
  try {
    const io = req.app.get("io");
    const { teamId } = req.body;

    const [item, team] = await Promise.all([
      Request.findById(req.params.id),
      Team.findById(teamId),
    ]);

    if (!item) return res.status(404).json({ message: "Request not found" });
    if (!team) return res.status(404).json({ message: "Rescue team not found" });

    await manuallyAssignRequestTeam(item, team);
    const hydrated = await populateRequestQuery(Request.findById(item._id));
    const serialized = serializeRequest(hydrated);

    if (io) {
      const payload = {
        requestId: item._id,
        teamId: serialized.dispatch?.teamId || team._id,
        teamName: serialized.dispatch?.teamName || team.name,
        memberCount: serialized.dispatch?.memberCount || 0,
        members: serialized.dispatch?.members || [],
        memberPhones: serialized.dispatch?.memberPhones || [],
        leadPhone: serialized.dispatch?.leadPhone || "",
        eta: serialized.dispatch?.eta || "",
        distance: serialized.dispatch?.distance || "",
        status: serialized.dispatch?.status || "EN_ROUTE",
      };

      if (item.userId) {
        io.to(`user_${item.userId}`).emit("request_team_assigned", payload);
      }
      io.to("admin_room").emit("request_team_assigned", payload);
      io.emit("stats.updated", { type: "request_assigned" });
    }

    // ──── AUTO-NOTIFICATION: Team Manually Assigned ────
    if (item.userId) {
      await notifyTeamAssigned(io, {
        userId: item.userId,
        teamName: team.name,
        eta: serialized.dispatch?.eta || "",
        memberCount: serialized.dispatch?.memberCount || team.memberCount,
      });
    }

    res.json(serialized);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PUT /api/requests/:id/status
 */
export const updateRequestStatus = async (req, res) => {
  try {
    const io = req.app.get("io");
    const { status } = req.body;
    const item = await Request.findById(req.params.id);

    if (!item) return res.status(404).json({ message: "Request not found" });

    item.status = status;
    if (item.dispatch) {
      item.dispatch.status =
        status === "resolved" ? "COMPLETED" : status === "cancelled" ? "CANCELLED" : item.dispatch.status;
      item.dispatch.lastUpdatedAt = new Date();
    }

    await item.save();

    if (["resolved", "cancelled"].includes(status)) {
      await releaseAssignedTeamIfNeeded(item);
    }

    const hydrated = await populateRequestQuery(Request.findById(item._id));
    const serialized = serializeRequest(hydrated);

    if (io) {
      if (item.userId) {
        io.to(`user_${item.userId}`).emit("request_status_updated", {
          requestId: item._id,
          status: item.status,
        });
      }
      io.to("admin_room").emit("request_status_updated", {
        requestId: item._id,
        status: item.status,
      });
      io.emit("stats.updated", { type: "request_status" });
    }

    // ──── AUTO-NOTIFICATION: Status Changed ────
    if (item.userId) {
      await notifyStatusChanged(io, {
        userId: item.userId,
        recordType: "Help Request",
        status: item.status,
        recordId: item._id,
      });

      // If resolved and team was dispatched → prompt review
      if (item.status === "resolved" && item.dispatch?.teamName) {
        await notifyResolvedWithReviewPrompt(io, {
          userId: item.userId,
          teamName: item.dispatch.teamName,
          recordType: "Help Request",
          recordId: item._id,
        });
      }
    }

    res.json(serialized);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

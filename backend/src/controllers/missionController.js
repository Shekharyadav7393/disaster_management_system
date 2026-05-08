import Mission from "../models/Mission.js";
import Team from "../models/Team.js";

/**
 * GET /api/missions
 */
export const getMissions = async (req, res) => {
  try {
    const { status, priority } = req.query;
    const query = {};
    if (status && status !== "all") query.status = status;
    if (priority && priority !== "all") query.priority = priority;

    const items = await Mission.find(query)
      .populate("assignedTeam")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/missions/:id
 */
export const getMissionById = async (req, res) => {
  try {
    const item = await Mission.findById(req.params.id).populate("assignedTeam");
    if (!item) return res.status(404).json({ message: "Mission not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/missions
 */
export const createMission = async (req, res) => {
  try {
    const io = req.app.get("io");
    const mission = new Mission(req.body);

    if (mission.assignedTeam) {
      const team = await Team.findById(mission.assignedTeam);
      if (team) {
        team.status = "DISPATCHED";
        await team.save();
      }
    }

    await mission.save();

    if (io) {
      io.emit("mission_created", mission);
    }

    res.status(201).json(mission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PATCH /api/missions/:id
 */
export const updateMission = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission) return res.status(404).json({ message: "Mission not found" });

    const oldStatus = mission.status;
    const newStatus = req.body.status;

    Object.assign(mission, req.body);
    await mission.save();

    // If mission completed, free up the team
    if (newStatus === "COMPLETED" && oldStatus !== "COMPLETED" && mission.assignedTeam) {
      await Team.findByIdAndUpdate(mission.assignedTeam, { status: "AVAILABLE" });
    }

    res.json(mission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * DELETE /api/missions/:id
 */
export const deleteMission = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission) return res.status(404).json({ message: "Mission not found" });

    // Free up the team if mission deleted
    if (mission.assignedTeam && mission.status !== "COMPLETED") {
      await Team.findByIdAndUpdate(mission.assignedTeam, { status: "AVAILABLE" });
    }

    await Mission.findByIdAndDelete(req.params.id);
    res.json({ message: "Mission deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

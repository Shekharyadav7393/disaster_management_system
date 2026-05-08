import Task from "../models/Task.js";

/**
 * GET /api/tasks
 */
export const getTasks = async (req, res) => {
  try {
    const { status, missionId } = req.query;
    const query = {};
    if (status && status !== "all") query.status = status;
    if (missionId) query.missionId = missionId;

    const items = await Task.find(query).populate("assignedTo").sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/tasks
 */
export const createTask = async (req, res) => {
  try {
    const item = new Task(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PATCH /api/tasks/:id
 */
export const updateTask = async (req, res) => {
  try {
    const item = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: "Task not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

import DisasterType from "../models/DisasterType.js";

/**
 * GET /api/disaster-types
 */
export const getDisasterTypes = async (req, res) => {
  try {
    const items = await DisasterType.find().sort({ label: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/disaster-types
 */
export const createDisasterType = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim().toLowerCase();
    const item = new DisasterType({
      name,
      value: name,
      label: req.body.label || name.charAt(0).toUpperCase() + name.slice(1)
    });
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PUT /api/disaster-types/:id
 */
export const updateDisasterType = async (req, res) => {
  try {
    const item = await DisasterType.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: "Disaster type not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * DELETE /api/disaster-types/:id
 */
export const deleteDisasterType = async (req, res) => {
  try {
    const item = await DisasterType.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Disaster type not found" });
    res.json({ message: "Disaster type deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

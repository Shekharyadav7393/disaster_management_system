import Zone from "../models/Zone.js";

/**
 * GET /api/zones
 */
export const getZones = async (req, res) => {
  try {
    const items = await Zone.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/zones
 */
export const createZone = async (req, res) => {
  try {
    const item = new Zone(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PATCH /api/zones/:id
 */
export const updateZone = async (req, res) => {
  try {
    const item = await Zone.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: "Zone not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * DELETE /api/zones/:id
 */
export const deleteZone = async (req, res) => {
  try {
    const item = await Zone.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Zone not found" });
    res.json({ message: "Zone deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

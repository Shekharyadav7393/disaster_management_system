import ReliefCamp from "../models/ReliefCamp.js";
import Resource from "../models/Resource.js";
import { normalizePointLocation } from "../utils/location.js";

/**
 * GET /api/relief-camps
 */
export const getReliefCamps = async (req, res) => {
  try {
    const camps = await ReliefCamp.find().sort({ createdAt: -1 });
    res.json(camps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/relief-camps/nearest
 */
export const getNearestReliefCamps = async (req, res) => {
  try {
    const { lat, lng, limit = 5 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: "lat and lng are required" });
    }

    const camps = await ReliefCamp.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: 50000 // 50km
        }
      }
    }).limit(parseInt(limit));

    res.json(camps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/relief-camps/:id
 */
export const getReliefCampById = async (req, res) => {
  try {
    const camp = await ReliefCamp.findById(req.params.id);
    if (!camp) return res.status(404).json({ message: "Relief camp not found" });
    res.json(camp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/relief-camps
 */
export const createReliefCamp = async (req, res) => {
  try {
    const camp = new ReliefCamp({
      ...req.body,
      location: normalizePointLocation(req.body.location, req.body.location),
      status: String(req.body.status || "ACTIVE").toUpperCase(),
    });
    await camp.save();
    res.status(201).json(camp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PATCH /api/relief-camps/:id
 */
export const updateReliefCamp = async (req, res) => {
  try {
    const updatePayload = { ...req.body };
    if (req.body.location) {
      updatePayload.location = normalizePointLocation(req.body.location, req.body.location);
    }
    if (req.body.status) {
      updatePayload.status = String(req.body.status).toUpperCase();
    }

    const camp = await ReliefCamp.findByIdAndUpdate(req.params.id, updatePayload, { new: true });
    if (!camp) return res.status(404).json({ message: "Relief camp not found" });
    res.json(camp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * DELETE /api/relief-camps/:id
 */
export const deleteReliefCamp = async (req, res) => {
  try {
    const camp = await ReliefCamp.findByIdAndDelete(req.params.id);
    if (!camp) return res.status(404).json({ message: "Relief camp not found" });
    res.json({ message: "Relief camp deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/resources/:campId
 */
export const getResources = async (req, res) => {
  try {
    const resources = await Resource.find({ campId: req.params.campId });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/resources
 */
export const createResource = async (req, res) => {
  try {
    const resourceData = {
      ...req.body,
      campId: req.body.campId || req.body.reliefCampId,
      type: (req.body.type || req.body.category || 'OTHER').toUpperCase()
    };
    const resource = new Resource(resourceData);
    await resource.save();
    res.status(201).json(resource);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * DELETE /api/resources/:id
 */
export const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) return res.status(404).json({ message: "Resource not found" });
    res.json({ message: "Resource deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

import User from "../models/User.js";

const toVolunteerResponse = (user) => {
  const item = user?.toObject ? user.toObject() : { ...(user || {}) };
  delete item.password;

  return {
    ...item,
    bio: item.details?.bio || "",
    emergencyContact: item.details?.emergencyContact || {},
    user: {
      _id: item._id,
      name: item.name,
      email: item.email,
      phone: item.phone,
    },
  };
};

/**
 * GET /api/volunteers
 */
export const getAllVolunteers = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { role: "volunteer" };
    if (status && status !== "all") query.status = status;

    const items = await User.find(query).sort({ createdAt: -1 });
    res.json(items.map(toVolunteerResponse));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PATCH /api/volunteers/:id/status
 */
export const updateVolunteerStatus = async (req, res) => {
  try {
    const updatePayload = { status: req.body.status };
    if (typeof req.body.assignedZone === "string") {
      updatePayload.assignedZone = req.body.assignedZone;
    }

    const item = await User.findByIdAndUpdate(req.params.id, updatePayload, { new: true });
    if (!item) return res.status(404).json({ message: "Volunteer not found" });
    res.json(toVolunteerResponse(item));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/volunteers/register
 */
export const registerVolunteer = async (req, res) => {
  try {
    const { skills, availability, bio, emergencyContact } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = "volunteer";
    user.status = user.status === "approved" || user.status === "active" ? user.status : "pending";
    user.skills = Array.isArray(skills)
      ? skills
      : String(skills || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
    user.availability = availability || "";
    user.details = {
      bio: bio || "",
      emergencyContact: emergencyContact || {}
    };
    user.totalHours = user.totalHours || 0;
    user.activityLog = user.activityLog || [];

    await user.save();
    const volunteer = toVolunteerResponse(user);
    res.status(201).json({ message: "Registered as volunteer", volunteer, user: volunteer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/volunteers/me
 */
export const getMyVolunteerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user || user.role !== "volunteer") {
      return res.status(404).json({ message: "Volunteer profile not found" });
    }
    res.json(toVolunteerResponse(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PATCH /api/volunteers/:id/activity
 */
export const logVolunteerActivity = async (req, res) => {
  try {
    const volunteer = await User.findById(req.params.id);
    if (!volunteer || volunteer.role !== "volunteer") {
      return res.status(404).json({ message: "Volunteer not found" });
    }

    const hours = Number(req.body.hours) || 0;
    volunteer.activityLog.push({
      action: req.body.action || "Volunteer activity",
      location: req.body.location || "",
      hours,
      date: new Date(),
    });
    volunteer.totalHours = (volunteer.totalHours || 0) + hours;
    if (volunteer.status === "approved") {
      volunteer.status = "active";
    }

    await volunteer.save();
    res.json({ message: "Activity logged", volunteer: toVolunteerResponse(volunteer) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PATCH /api/volunteers/:id/assign
 */
export const assignVolunteer = async (req, res) => {
  try {
    const volunteer = await User.findById(req.params.id);
    if (!volunteer || volunteer.role !== "volunteer") {
      return res.status(404).json({ message: "Volunteer not found" });
    }

    if (req.body.assignedZone) {
      volunteer.assignedZone = req.body.assignedZone;
    }
    if (req.body.status) {
      volunteer.status = req.body.status;
    }

    await volunteer.save();
    res.json({ message: "Volunteer assigned", volunteer: toVolunteerResponse(volunteer) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

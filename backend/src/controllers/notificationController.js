import Notification from "../models/Notification.js";
import Alert from "../models/Alert.js";

/**
 * GET /api/notifications/public
 */
export const getPublicNotifications = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    const query = Notification.find().sort({ createdAt: -1 });
    if (limit) query.limit(limit);
    const items = await query;
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/notifications
 */
export const getNotifications = async (req, res) => {
  try {
    const items = await Notification.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/notifications
 */
export const createNotification = async (req, res) => {
  try {
    const io = req.app.get("io");
    const notification = new Notification({
      ...req.body,
      sentBy: { _id: req.user?._id, name: req.user?.name || "System" }
    });

    await notification.save();

    if (io) {
      io.emit("notification_created", notification);
      
      // If it's a high severity alert, create an actual Alert record too
      if (notification.type === "alert" && notification.severity === "critical") {
        const alert = new Alert({
          title: notification.title,
          description: notification.message,
          message: notification.message,
          type: "other",
          severity: "critical",
          status: "active",
          location: { address: notification.targetAreas?.[0] || "Broadcast Zone" }
        });
        await alert.save();
        io.emit("new_alert", alert);
      }
    }

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PATCH /api/notifications/:id/read
 */
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: "Notification not found" });

    if (!notification.readBy.includes(req.user._id)) {
      notification.readBy.push(req.user._id);
      await notification.save();
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * DELETE /api/notifications/:id
 */
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/notifications/mine
 * Get notifications targeted to the logged-in user + broadcast notifications.
 */
export const getUserNotifications = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 30;
    const items = await Notification.find({
      $or: [
        { targetUserId: req.user._id },
        { targetUserId: null, type: { $in: ["broadcast", "alert"] } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

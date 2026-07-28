import mongoose from "mongoose";
import Notification from "../models/notification.model.js";

// GET /api/notifications
export const getMyNotifications = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50); // limit to recent 50

    res.json({ message: "Notifications fetched successfully", data: notifications });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/notifications/:id/read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.userId);

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Marked as read", data: notification });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

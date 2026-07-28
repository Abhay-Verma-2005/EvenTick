import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index to quickly fetch a user's unread/recent notifications
notificationSchema.index({ userId: 1, createdAt: -1 });

// Middleware to keep only the last 10 notifications per user
notificationSchema.post("save", async function () {
  try {
    const limit = 10;
    // Find the newest notifications to keep
    const notificationsToKeep = await mongoose.models.Notification.find({ userId: this.userId })
      .sort({ createdAt: -1 })
      .select("_id")
      .limit(limit);

    if (notificationsToKeep.length >= limit) {
      const keepIds = notificationsToKeep.map(n => n._id);
      // Delete any notifications not in the keep list for this user
      await mongoose.models.Notification.deleteMany({
        userId: this.userId,
        _id: { $nin: keepIds }
      });
    }
  } catch (err) {
    console.error("Error in notification cleanup middleware:", err);
  }
});

export default mongoose.model("Notification", notificationSchema);

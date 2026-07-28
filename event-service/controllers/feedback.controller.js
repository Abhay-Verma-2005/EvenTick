import Feedback from "../models/feedback.model.js";

// POST /api/feedback — Submit feedback
export const submitFeedback = async (req, res) => {
  try {
    const userId = req.userId;
    const { rating, message, userName, userPhoto } = req.body;

    if (!rating || !message) {
      return res.status(400).json({ message: "Rating and message are required." });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5." });
    }

    // Check if user already submitted feedback
    const existing = await Feedback.findOne({ userId });
    if (existing) {
      // Update existing feedback
      existing.rating = rating;
      existing.message = message;
      existing.userName = userName || existing.userName;
      existing.userPhoto = userPhoto || existing.userPhoto;
      await existing.save();
      return res.json({ message: "Feedback updated successfully!", data: existing });
    }

    const feedback = await Feedback.create({
      userId,
      rating,
      message,
      userName: userName || "User",
      userPhoto: userPhoto || "",
    });

    res.status(201).json({ message: "Feedback submitted successfully!", data: feedback });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/feedback/top — Get top 3 highest-rated feedbacks (public)
export const getTopFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .sort({ rating: -1, createdAt: -1 })
      .limit(3);

    res.json({ message: "Top feedbacks fetched", data: feedbacks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

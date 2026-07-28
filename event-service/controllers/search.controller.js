import Event from "../models/event.model.js";

// GET /api/events/search?q=
export const searchEvents = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query || query.trim() === "") {
      return res.json({ data: [] });
    }

    const regex = new RegExp(query.trim(), "i"); // case-insensitive

    const events = await Event.find({
      status: "live",
      $or: [{ title: regex }, { city: regex }],
    })
      .select("_id title city date imageUrl price")
      .sort({ date: 1 })
      .limit(5)
      .lean();

    res.json({
      message: "Search successful",
      data: events,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

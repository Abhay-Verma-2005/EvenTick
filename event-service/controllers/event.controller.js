import Event from "../models/event.model.js";
import Notification from "../models/notification.model.js";
import Booking from "../models/booking.model.js";
import cloudinary from "../config/cloudinary.js";
import mongoose from "mongoose";
import redis from "../config/redisClient.js";

// Helper for Redis caching
const getFromCache = async (key, fetcher, ttlInSeconds) => {
  try {
    const cachedData = await redis.get(key);
    if (cachedData) {
      return cachedData;
    }
  } catch (error) {
    console.error(`Redis Get Error for key ${key}:`, error);
  }

  const freshData = await fetcher();

  try {
    if (freshData) {
      await redis.set(key, freshData, { ex: ttlInSeconds });
    }
  } catch (error) {
    console.error(`Redis Set Error for key ${key}:`, error);
  }

  return freshData;
};

// Helper to invalidate cache keys
const invalidateEventCaches = async (city, eventId) => {
  try {
    const keysToDelete = ["events:newest", "events:hero"];
    if (city) keysToDelete.push(`events:city:${city.toLowerCase().trim()}`);
    if (eventId) keysToDelete.push(`events:event:${eventId}`);
    
    if (keysToDelete.length > 0) {
      await redis.del(...keysToDelete);
    }
  } catch (err) {
    console.error("Redis Invalidation Error:", err);
  }
};

// Helper to build flexible host query (handles String and ObjectId matches)
const getHostQuery = (userId) => {
  const query = {
    $or: [{ hostId: userId }, { hostId: String(userId) }],
  };
  if (mongoose.Types.ObjectId.isValid(userId)) {
    query.$or.push({ hostId: new mongoose.Types.ObjectId(userId) });
  }
  return query;
};

// GET /api/events — Get all live events (paginated)
export const getAllEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const filter = { status: "live" };

    // Optional city filter
    if (req.query.city) {
      filter.city = req.query.city.toLowerCase().trim();
    }

    // Optional category filter
    if (req.query.category) {
      filter.category = req.query.category.toLowerCase().trim();
    }

    const [events, total] = await Promise.all([
      Event.find(filter)
        .sort({ date: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments(filter),
    ]);

    res.json({
      message: "Events fetched successfully",
      data: events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// GET /api/events/recommended?city= — Smart recommendations (Top 5 only)
export const getRecommendedEvents = async (req, res) => {
  try {
    const userCity = (req.query.city || "").toLowerCase().trim();
    const liveFilter = { status: "live" };

    // 1st Priority: Events near user's city
    let nearbyEvents = [];
    if (userCity) {
      const cacheKey = `events:city:${userCity}`;
      nearbyEvents = await getFromCache(cacheKey, async () => {
        return await Event.find({ ...liveFilter, city: userCity })
          .sort({ date: 1 })
          .limit(5)
          .lean();
      }, 300); // 300s = 5 mins
    }

    // 2nd Priority: Newest live events
    const newestEvents = await getFromCache("events:newest", async () => {
      return await Event.find(liveFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
    }, 180); // 180s = 3 mins

    // 3rd Priority: Popular events by rating
    const popularEvents = await getFromCache("events:hero", async () => {
      return await Event.find({ ...liveFilter, rating: { $gte: 3.5 } })
        .sort({ rating: -1, ratingCount: -1 })
        .limit(5)
        .lean();
    }, 600); // 600s = 10 mins

    // Combine in priority order: Nearby -> Newest -> Popular
    const combinedEvents = [...nearbyEvents, ...newestEvents, ...popularEvents];

    // Deduplicate by _id
    const seen = new Set();
    const dedupe = (arr) =>
      arr.filter((e) => {
        const id = e._id.toString();
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });

    const top5Recommendations = dedupe(combinedEvents).slice(0, 5);

    // Build dedicated arrays for Near By and Newest (4 items max)
    let paddedNearBy = [...nearbyEvents];
    if (paddedNearBy.length < 4) {
      // Pad with newest events ensuring no duplicates within the Near By array
      const nearBySeen = new Set(paddedNearBy.map(e => e._id.toString()));
      for (const event of newestEvents) {
        if (!nearBySeen.has(event._id.toString())) {
          paddedNearBy.push(event);
          nearBySeen.add(event._id.toString());
        }
        if (paddedNearBy.length === 4) break;
      }
    }
    paddedNearBy = paddedNearBy.slice(0, 4);

    const newestEventsFinal = newestEvents.slice(0, 4);

    res.json({
      message: "Recommendations fetched successfully",
      data: {
        top5: top5Recommendations,
        nearByEvents: paddedNearBy,
        newestEvents: newestEventsFinal
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// GET /api/events/:id — Get single event
export const getEventById = async (req, res) => {
  try {
    const eventId = req.params.id;
    const cacheKey = `events:event:${eventId}`;
    
    const event = await getFromCache(cacheKey, async () => {
      return await Event.findById(eventId).lean();
    }, 1800); // 1800s = 30 mins

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json({ message: "Event fetched successfully", data: event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// POST /api/events/upload-banner — Upload image to Cloudinary
export const uploadBannerController = async (req, res) => {
  try {
    const { image, type } = req.body;
    if (!image) {
      return res.status(400).json({ message: "Image file data is required" });
    }

    const folder = type === "flex" ? "eventick_event_flexes" : "eventick_event_posters";

    const uploadResult = await cloudinary.uploader.upload(image, {
      folder,
    });

    res.json({
      message: `${type || "Image"} uploaded successfully!`,
      imageUrl: uploadResult.secure_url,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// POST /api/events — Host creates an event (auth required)
export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      posterImage,
      posterUrl,
      flexImage,
      flexUrl,
      image,
      imageUrl,
      date,
      time,
      venue,
      city,
      price,
      totalSeats,
      hostName,
      tags,
    } = req.body;

    if (!title || !category || !date || !city) {
      return res.status(400).json({ message: "Required fields missing: title, category, date, city are required." });
    }

    let finalPosterUrl = (posterUrl && posterUrl.startsWith("http")) ? posterUrl : (imageUrl && imageUrl.startsWith("http")) ? imageUrl : "";
    let finalFlexUrl = (flexUrl && flexUrl.startsWith("http")) ? flexUrl : "";

    const uploadTasks = [];

    // Poster Cloudinary upload task
    const posterData = posterImage || image;
    if (posterData && posterData.startsWith("data:image")) {
      uploadTasks.push(
        cloudinary.uploader.upload(posterData, { folder: "eventick_event_posters" })
          .then((res) => { finalPosterUrl = res.secure_url; })
          .catch((err) => console.error("Poster Cloudinary upload error:", err))
      );
    }

    // Flex Cloudinary upload task
    if (flexImage && flexImage.startsWith("data:image")) {
      uploadTasks.push(
        cloudinary.uploader.upload(flexImage, { folder: "eventick_event_flexes" })
          .then((res) => { finalFlexUrl = res.secure_url; })
          .catch((err) => console.error("Flex Cloudinary upload error:", err))
      );
    }

    // Run uploads in parallel for maximum speed
    if (uploadTasks.length > 0) {
      await Promise.all(uploadTasks);
    }

    let generatedCatchyLine = "Live the Moment. Make it Memorable.";
    try {
      const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
      const aiResponse = await fetch(`${process.env.AI_SERVICE_URL}/api/ai/tagline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": token ? `token=${token}` : "",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          eventTitle: title,
          eventCategory: category,
          description: description || ""
        })
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        if (aiData.success && aiData.tagline) {
          generatedCatchyLine = aiData.tagline;
        }
      }
    } catch (aiErr) {
      console.log("AI Catchy Line generation failed, using default.", aiErr.message);
    }

    const event = new Event({
      title,
      description: description || "",
      catchyLine: generatedCatchyLine,
      category: category.toLowerCase().trim(),
      ...(finalPosterUrl && { posterUrl: finalPosterUrl, imageUrl: finalPosterUrl }),
      ...(finalFlexUrl && { flexUrl: finalFlexUrl }),
      date: new Date(date),
      time: time || "7:00 PM",
      venue: venue || "Main Venue",
      city: city.toLowerCase().trim(),
      price: Number(price) || 0,
      totalSeats: Number(totalSeats) || 100,
      availableSeats: Number(totalSeats) || 100,
      hostId: req.userId,
      hostName: hostName || "Event Host",
      tags: tags || [],
    });

    const savedEvent = await event.save();

    // Notify the host that their event is now live
    await Notification.create({
      userId: req.userId,
      title: "Your Event is Now Live!",
      message: `"${title}" has been published successfully and is now live on Eventick! Start sharing it with your audience.`,
    });

    // Invalidate caches
    await invalidateEventCaches(savedEvent.city, null);

    res.status(201).json({ message: "Event created successfully!", data: savedEvent });
  } catch (err) {
    console.error("createEvent Error:", err);
    res.status(400).json({ message: err.message || "Failed to create event." });
  }
};


// GET /api/events/my-events — Host's own events (auth required)
export const getHostEvents = async (req, res) => {
  try {
    const hostFilter = getHostQuery(req.userId);
    const events = await Event.find(hostFilter)
      .sort({ createdAt: -1 })
      .lean();

    res.json({ message: "Host events fetched", data: events });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// PATCH /api/events/:id — Update host event (auth required)
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const hostQuery = { _id: id, ...getHostQuery(req.userId) };
    const event = await Event.findOne(hostQuery);

    if (!event) {
      return res.status(404).json({ message: "Event not found or unauthorized" });
    }

    const uploadTasks = [];

    // Poster upload task
    const posterData = req.body.posterImage || req.body.image;
    if (posterData && posterData.startsWith("data:image")) {
      uploadTasks.push(
        cloudinary.uploader.upload(posterData, { folder: "eventick_event_posters" })
          .then((res) => {
            event.posterUrl = res.secure_url;
            event.imageUrl = res.secure_url;
          })
          .catch((err) => console.error("Update poster Cloudinary error:", err))
      );
    } else if (req.body.posterUrl && req.body.posterUrl.startsWith("http")) {
      event.posterUrl = req.body.posterUrl;
      event.imageUrl = req.body.posterUrl;
    }

    // Flex upload task
    if (req.body.flexImage && req.body.flexImage.startsWith("data:image")) {
      uploadTasks.push(
        cloudinary.uploader.upload(req.body.flexImage, { folder: "eventick_event_flexes" })
          .then((res) => {
            event.flexUrl = res.secure_url;
          })
          .catch((err) => console.error("Update flex Cloudinary error:", err))
      );
    } else if (req.body.flexUrl && req.body.flexUrl.startsWith("http")) {
      event.flexUrl = req.body.flexUrl;
    }

    if (uploadTasks.length > 0) {
      await Promise.all(uploadTasks);
    }

    const oldCity = event.city;

    if (req.body.title) event.title = req.body.title;
    if (req.body.description !== undefined) event.description = req.body.description;
    if (req.body.category) event.category = req.body.category.toLowerCase().trim();
    if (req.body.date) event.date = new Date(req.body.date);
    if (req.body.time) event.time = req.body.time;
    if (req.body.venue) event.venue = req.body.venue;
    if (req.body.city) event.city = req.body.city.toLowerCase().trim();
    if (req.body.price !== undefined) event.price = Number(req.body.price);
    if (req.body.totalSeats !== undefined) {
      const diff = Number(req.body.totalSeats) - event.totalSeats;
      event.totalSeats = Number(req.body.totalSeats);
      event.availableSeats = Math.max(0, event.availableSeats + diff);
    }
    if (req.body.status) event.status = req.body.status;

    const updated = await event.save();
    
    // Invalidate caches
    await invalidateEventCaches(updated.city, updated._id);
    if (oldCity && oldCity !== updated.city) {
      await invalidateEventCaches(oldCity, null);
    }
    
    res.json({ message: "Event updated successfully", data: updated });
  } catch (err) {
    console.error("updateEvent Error:", err);
    res.status(400).json({ message: err.message || "Failed to update event." });
  }
};


// DELETE /api/events/:id — Delete host event (auth required)
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const hostQuery = { _id: id, ...getHostQuery(req.userId) };
    
    const event = await Event.findOne(hostQuery);
    if (!event) {
      return res.status(404).json({ message: "Event not found or unauthorized" });
    }

    const isUpcoming = !event.isPast();

    // Delete the event
    await Event.findByIdAndDelete(event._id);

    // Invalidate caches
    await invalidateEventCaches(event.city, event._id);

    // Process all bookings for this event
    const bookings = await Booking.find({ eventId: event._id });
    if (bookings.length > 0) {
      if (isUpcoming) {
        // Send notifications to all booked users
        const notifications = bookings.map(b => ({
          userId: b.userId,
          title: "🚨 Event Cancelled",
          message: `The upcoming event "${event.title}" has been cancelled. Your booking of ${b.quantity} ticket(s) has been refunded.`
        }));
        await Notification.insertMany(notifications);
      }
      
      // Delete all bookings so they are removed from My Tickets
      await Booking.deleteMany({ eventId: event._id });
    }

    res.json({ message: "Event deleted successfully", data: event });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// GET /api/events/host/stats — Host statistics
export const getHostStats = async (req, res) => {
  try {
    const hostFilter = getHostQuery(req.userId);
    const events = await Event.find(hostFilter).lean();
    
    const totalEvents = events.length;
    const activeEvents = events.filter((e) => e.status === "live").length;
    
    const totalRatings = events.reduce((sum, e) => sum + (e.ratingCount || 0), 0);
    const avgRatingSum = events.reduce((sum, e) => sum + ((e.rating || 0) * (e.ratingCount || 0)), 0);
    const avgRating = totalRatings > 0 ? Number((avgRatingSum / totalRatings).toFixed(1)) : 0;
    
    const totalActiveUsers = events.reduce(
      (sum, e) => sum + ((e.totalSeats || 0) - (e.availableSeats || 0)),
      0
    );

    const eventIds = events.map((e) => e._id);
    const uniqueAttendees = await Booking.distinct("userId", { eventId: { $in: eventIds }, status: { $ne: "cancelled" } });
    const totalAttendees = uniqueAttendees.length;

    res.json({
      message: "Host stats fetched successfully",
      data: {
        totalEvents,
        activeEvents,
        totalRatings,
        avgRating,
        totalActiveUsers,
        totalAttendees,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/events/:id/rate — Submit 1-5 star rating for an event
export const rateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { rating } = req.body;
    const userId = req.userId; // from verifyJWT

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (!event.ratings) event.ratings = [];

    const existingIndex = event.ratings.findIndex(
      (r) => r.userId?.toString() === userId?.toString()
    );

    if (existingIndex > -1) {
      event.ratings[existingIndex].rating = numRating;
    } else {
      event.ratings.push({ userId, rating: numRating });
    }

    const totalSum = event.ratings.reduce((sum, r) => sum + r.rating, 0);
    event.ratingCount = event.ratings.length;
    event.rating = Number((totalSum / event.ratings.length).toFixed(1));

    await event.save();

    // Invalidate caches
    await invalidateEventCaches(null, eventId);

    res.json({
      message: "Rating submitted successfully",
      rating: event.rating,
      ratingCount: event.ratingCount,
      userRating: numRating
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


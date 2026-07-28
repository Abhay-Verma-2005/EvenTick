import express from "express";
import { verifyJWT } from "../middlewares/verifyJWT.js";
import {
  getAllEvents,
  getRecommendedEvents,
  getEventById,
  createEvent,
  getHostEvents,
  updateEvent,
  deleteEvent,
  getHostStats,
  uploadBannerController,
  rateEvent,
} from "../controllers/event.controller.js";
import { searchEvents } from "../controllers/search.controller.js";

const eventRouter = express.Router();

// Public routes
eventRouter.get("/recommended", getRecommendedEvents);
eventRouter.get("/search", searchEvents);
eventRouter.get("/", getAllEvents);

// Protected host routes (auth required)
eventRouter.get("/host/stats", verifyJWT, getHostStats);
eventRouter.get("/host/my-events", verifyJWT, getHostEvents);
eventRouter.post("/host/upload-banner", verifyJWT, uploadBannerController);
eventRouter.post("/host/", verifyJWT, createEvent);

// Protected Rating route
eventRouter.post("/:id/rate", verifyJWT, rateEvent);

// Dynamic routes and ID-based routes (must come last)
eventRouter.get("/:id", getEventById);
eventRouter.patch("/host/:id", verifyJWT, updateEvent);
eventRouter.delete("/host/:id", verifyJWT, deleteEvent);

export default eventRouter;

import express from "express";
import { verifyUser } from "../middlewares/aiAuth.js";
import { generateAIResponse, clearChat, generateTagline, generateDescription } from "../controllers/controller.js";

const aiRouter = express.Router();

aiRouter.get("/", (req, res) => {
  res.json({ message: "AI Service is running" });
});

// AI Response 
aiRouter.post("/response", verifyUser, generateAIResponse);

// Clear Chat History
aiRouter.delete("/clear", verifyUser, clearChat);

// Generate Event Tagline
aiRouter.post("/tagline", verifyUser, generateTagline);

// Generate Event Description
aiRouter.post("/description", verifyUser, generateDescription);




export default aiRouter;

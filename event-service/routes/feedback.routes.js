import express from "express";
import { verifyJWT } from "../middlewares/verifyJWT.js";
import { submitFeedback, getTopFeedbacks } from "../controllers/feedback.controller.js";

const feedbackRouter = express.Router();
feedbackRouter.get("/top", getTopFeedbacks);
feedbackRouter.post("/", verifyJWT, submitFeedback);

export default feedbackRouter;

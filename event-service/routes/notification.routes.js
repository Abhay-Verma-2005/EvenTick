import express from "express";
import { verifyJWT } from "../middlewares/verifyJWT.js";
import { getMyNotifications, markAsRead } from "../controllers/notification.controller.js";

const notificationRouter = express.Router();

notificationRouter.use(verifyJWT);

notificationRouter.get("/", getMyNotifications);
notificationRouter.patch("/:id/read", markAsRead);

export default notificationRouter;

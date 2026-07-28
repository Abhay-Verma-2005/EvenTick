import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import eventRouter from "./routes/event.routes.js";
import bookingRouter from "./routes/booking.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import feedbackRouter from "./routes/feedback.routes.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS.split(","),
    credentials: true,
  })
);

// Routes
app.use("/api/events", eventRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/feedback", feedbackRouter);

app.get("/api", (req, res) => {
  res.json({ message: "Event Service is Working" });
});

import setupCronJobs from "./cron/scheduler.js";

// Connect DB & Start Server
connectDB()
  .then(() => {
    console.log("Database connected");
    
    // Initialize cron jobs
    setupCronJobs();

    app.listen(PORT, () => {
      console.log(`event Server : http://localhost:${PORT}/api`);
    });
  })
  .catch((err) => {
    console.error("Database cannot be connected!!", err.message);
  });

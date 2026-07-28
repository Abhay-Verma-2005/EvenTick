import cron from "node-cron";
import Event from "../models/event.model.js";
import Booking from "../models/booking.model.js";
import Notification from "../models/notification.model.js";

const setupCronJobs = () => {
  // 1. 24-Hour Reminder Job
  // Runs every hour at the top of the hour
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();
      const next24HoursStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const next24HoursEnd = new Date(next24HoursStart.getTime() + 60 * 60 * 1000); // 1 hour window
 
      // Find live events starting exactly ~24 hours from now
      const upcomingEvents = await Event.find({
        status: "live",
        date: { $gte: next24HoursStart, $lt: next24HoursEnd },
      });

      for (const event of upcomingEvents) {
        await Notification.create({
          userId: event.hostId,
          title: "Event Reminder",
          message: `Your event "${event.title}" is starting in 24 hours! Get ready!`,
        });
        console.log(`[Cron] Sent 24h reminder for event: ${event.title}`);
      }
    } catch (err) {
      console.error("[Cron Error] 24-Hour Reminder:", err.message);
    }
  });

  // 2. Event Expiry Job
  // Runs every hour to check for events that have passed
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();

      // Find events that are still "live" or "upcoming" but their date has passed
      // We assume if date < now, the event is over. 
      // (For a real system, you'd add duration to date to get exact end time)
      const pastEvents = await Event.find({
        status: { $in: ["live", "upcoming"] },
        date: { $lt: now },
      });

      for (const event of pastEvents) {
        // Mark event as completed
        event.status = "completed";
        await event.save();

        // Expire all bookings for this event
        await Booking.updateMany(
          { eventId: event._id, status: "booked" },
          { $set: { status: "expired" } }
        );

        console.log(`[Cron] Expired event and tickets: ${event.title}`);
      }
    } catch (err) {
      console.error("[Cron Error] Event Expiry:", err.message);
    }
  });

  console.log("Cron jobs initialized.");
};

export default setupCronJobs;

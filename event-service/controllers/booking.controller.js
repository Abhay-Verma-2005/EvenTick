import Booking from "../models/booking.model.js";
import Event from "../models/event.model.js";
import Notification from "../models/notification.model.js";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";

// POST /api/bookings/:eventId
export const bookTicket = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.userId;
    const quantity = parseInt(req.body.quantity) || 1;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.status !== "live") {
      return res
        .status(400)
        .json({ message: "This event is no longer active" });
    }

    // Optional: check available seats if tracking
    if (event.availableSeats !== undefined && event.availableSeats < quantity) {
      return res.status(400).json({ message: "Not enough seats available" });
    }

    const totalPrice = (event.price || 0) * quantity;
    const ticketNumber = `TKT-${uuidv4().substring(0, 8).toUpperCase()}`;

    const booking = new Booking({
      userId,
      eventId,
      hostId: event.hostId,
      ticketNumber,
      quantity,
      totalPrice,
      status: "booked",
    });

    await booking.save();

    // If tracking seats, decrement
    if (event.availableSeats !== undefined) {
      event.availableSeats -= quantity;
      await event.save();
    }

    // Create notification for user (booking confirmed)
    await Notification.create({
      userId,
      title: "Ticket Confirmed!",
      message: `You've successfully booked ${quantity} ticket(s) for "${event.title}". Ticket #: ${ticketNumber}. We can't wait to see you there!`,
    });

    // Notify the host of a new booking
    await Notification.create({
      userId: event.hostId,
      title: "New Booking Received!",
      message: `${quantity} ticket(s) were just booked for your event "${event.title}" (Ticket #: ${ticketNumber}). Remaining seats: ${event.availableSeats !== undefined ? event.availableSeats - quantity : "N/A"}.`,
    });

    res.status(201).json({ message: "Ticket booked successfully", booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/bookings/:bookingId/cancel
export const cancelTicket = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;

    const booking = await Booking.findOne({ _id: bookingId, userId });
    if (!booking) {
      return res
        .status(404)
        .json({ message: "Booking not found or unauthorized" });
    }

    if (booking.status !== "booked") {
      return res
        .status(400)
        .json({
          message: `Cannot cancel ticket with status: ${booking.status}`,
        });
    }

    // Fetch event for details and validation
    const event = await Event.findById(booking.eventId);

    if (event && !event.isCancellable()) {
      return res.status(400).json({
        message: "Tickets cannot be cancelled within 1 hour of the event or if the event has passed.",
      });
    }

    booking.status = "cancelled";
    await booking.save();

    // Optionally restore seats
    if (event && event.availableSeats !== undefined) {
      event.availableSeats += booking.quantity;
      await event.save();
    }

    // Notify the USER their cancellation was successful
    await Notification.create({
      userId,
      title: "Booking Cancelled",
      message: `Your ${booking.quantity} ticket(s) for "${event?.title || "the event"}" (Ticket #: ${booking.ticketNumber}) have been cancelled successfully.`,
    });

    // Notify the HOST of the cancellation
    if (event) {
      await Notification.create({
        userId: event.hostId,
        title: "Booking Cancelled",
        message: `A booking of ${booking.quantity} ticket(s) (Ticket #: ${booking.ticketNumber}) was cancelled for your event "${event.title}". Seats have been restored.`,
      });
    }

    res.json({ message: "Ticket cancelled successfully", booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/bookings/my-tickets
export const getMyTickets = async (req, res) => {
  try {
    const userId = req.userId;
    const bookings = await Booking.find({ userId })
      .populate("eventId", "title imageUrl posterUrl date time venue city")
      .sort({ createdAt: -1 });

    const validBookings = bookings.filter((b) => b.eventId !== null);

    // Clean up dangling bookings (where event was deleted) from the database asynchronously
    const invalidBookingIds = bookings
      .filter((b) => b.eventId === null)
      .map((b) => b._id);
    if (invalidBookingIds.length > 0) {
      Booking.deleteMany({ _id: { $in: invalidBookingIds } }).catch(
        console.error,
      );
    }

    res.json({ message: "Tickets fetched successfully", data: validBookings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

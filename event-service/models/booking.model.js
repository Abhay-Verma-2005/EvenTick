import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["booked", "cancelled", "expired"],
      default: "booked",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes to speed up queries for "My Tickets" and Host Analytics
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ hostId: 1, eventId: 1 });
bookingSchema.index({ eventId: 1 });

export default mongoose.model("Booking", bookingSchema);

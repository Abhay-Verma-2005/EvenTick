const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  qrCode:        { type: String, required: true },
  seatNumber:    { type: String },
  paymentStatus: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'SUCCESS' },
  bookingId:     { type: String, required: true, unique: true },
  cancelled:     { type: Boolean, default: false },
  cancelledAt:   { type: Date },
  refundStatus:  { type: String, enum: ['NONE', 'PENDING', 'REFUNDED'], default: 'NONE' },
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);

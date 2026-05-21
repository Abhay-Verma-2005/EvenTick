const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:   { type: String, required: true },
  text:   { type: String, required: true },
}, { timestamps: true });

const eventSchema = new mongoose.Schema({
  organiserId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  venueId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
  title:         { type: String, required: true },
  description:   { type: String, required: true },
  date:          { type: Date, required: true },
  endDate:       { type: Date },
  ticketPrice:   { type: Number, required: true },
  totalTickets:  { type: Number, required: true },
  soldTickets:   { type: Number, default: 0 },
  cancelledTickets: { type: Number, default: 0 },
  bannerImage:   { type: String, default: '' },
  photos:        [{ type: String }],
  hashtags:      [{ type: String }],
  ticketTheme:   { type: String, default: '' },
  status:        { type: String, enum: ['Draft', 'Live', 'Completed'], default: 'Draft' },
  likes:         [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments:      [commentSchema],
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);

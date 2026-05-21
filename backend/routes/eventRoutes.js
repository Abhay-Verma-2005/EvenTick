const express = require('express');
const Event = require('../models/Event');
const User = require('../models/User');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

const router = express.Router();

// Haversine helper
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ────────────────────────────────────────────────────────────────
// All named routes MUST come before /:id wildcard
// ────────────────────────────────────────────────────────────────

// Public: all live events (optional city filter)
router.get('/', async (req, res) => {
  try {
    const { city } = req.query;
    let events = await Event.find({ status: 'Live' })
      .populate('venueId')
      .populate('organiserId', 'name')
      .sort({ createdAt: -1 });
    if (city) {
      events = events.filter(e =>
        e.venueId?.city?.toLowerCase().includes(city.toLowerCase())
      );
    }
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Public: nearby events  ← MUST be before /:id
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query;
    if (!lat || !lng) return res.status(400).json({ message: 'lat and lng required' });

    const events = await Event.find({ status: 'Live' })
      .populate('venueId')
      .populate('organiserId', 'name')
      .sort({ createdAt: -1 });

    const nearby = events
      .filter(e => {
        const vLat = e.venueId?.latitude;
        const vLng = e.venueId?.longitude;
        if (!vLat || !vLng) return false;
        return haversine(Number(lat), Number(lng), vLat, vLng) <= Number(radius);
      })
      .slice(0, 8);

    res.json(nearby);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Organiser: my events  ← MUST be before /:id
router.get('/my-events', authMiddleware, roleMiddleware(['ORGANISER']), async (req, res) => {
  try {
    const events = await Event.find({ organiserId: req.user.id })
      .populate('venueId')
      .sort({ createdAt: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching your events' });
  }
});

// Organiser: create event
router.post('/create', authMiddleware, roleMiddleware(['ORGANISER']), async (req, res) => {
  try {
    const { venueId, title, description, date, endDate, ticketPrice, totalTickets, bannerImage, photos, hashtags, ticketTheme, status } = req.body;
    if (!venueId || !title || !description || !date || !ticketPrice || !totalTickets) {
      return res.status(400).json({ message: 'All required fields must be filled' });
    }
    const event = new Event({
      organiserId:  req.user.id,
      venueId,
      title,
      description,
      date,
      endDate:      endDate || null,
      ticketPrice:  Number(ticketPrice),
      totalTickets: Number(totalTickets),
      bannerImage:  bannerImage || '',
      photos:       Array.isArray(photos) ? photos : [],
      hashtags:     Array.isArray(hashtags) ? hashtags : [],
      ticketTheme:  ticketTheme || '',
      status:       status || 'Draft',
    });
    await event.save();
    const populated = await event.populate('venueId');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error creating event' });
  }
});

// Organiser: update status  ← MUST be before /:id/like etc.
router.patch('/:id/status', authMiddleware, roleMiddleware(['ORGANISER']), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Draft', 'Live', 'Completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, organiserId: req.user.id },
      { status },
      { new: true }
    ).populate('venueId');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Organiser: delete event
router.delete('/:id', authMiddleware, roleMiddleware(['ORGANISER']), async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({ _id: req.params.id, organiserId: req.user.id });
    if (!event) return res.status(404).json({ message: 'Event not found or not yours' });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Organiser: get attendees
router.get('/:id/attendees', authMiddleware, roleMiddleware(['ORGANISER']), async (req, res) => {
  try {
    const Ticket = require('../models/Ticket');
    const tickets = await Ticket.find({ eventId: req.params.id, cancelled: false })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Authenticated: toggle like
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const idx = event.likes.findIndex(id => id.toString() === req.user.id);
    if (idx === -1) event.likes.push(req.user.id);
    else event.likes.splice(idx, 1);
    await event.save();
    res.json({ likes: event.likes.length, liked: idx === -1 });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Authenticated: toggle save
router.post('/:id/save', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const idx = event.saves.findIndex(id => id.toString() === req.user.id);
    if (idx === -1) event.saves.push(req.user.id);
    else event.saves.splice(idx, 1);
    await event.save();
    res.json({ saves: event.saves.length, saved: idx === -1 });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Authenticated: add comment
router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment cannot be empty' });
    const user  = await User.findById(req.user.id);
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    event.comments.push({ userId: req.user.id, name: user.name, text: text.trim() });
    await event.save();
    res.json(event.comments[event.comments.length - 1]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

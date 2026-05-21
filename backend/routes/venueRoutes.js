const express = require('express');
const Venue = require('../models/Venue');
const User = require('../models/User');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

const router = express.Router();

// ────────────────────────────────────────────────────────────────
// IMPORTANT: Specific named routes MUST come before /:id wildcard
// ────────────────────────────────────────────────────────────────

// Provider: get my venues  ← MUST be before /:id
router.get('/my-venues', authMiddleware, roleMiddleware(['PROVIDER']), async (req, res) => {
  try {
    const venues = await Venue.find({ providerId: req.user.id }).sort({ createdAt: -1 });
    res.json(venues);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching your venues' });
  }
});

// Public: search venues by city/state  ← MUST be before /:id
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { city, state } = req.query;
    const filter = {};
    if (city)  filter.city  = { $regex: new RegExp(city, 'i') };
    if (state) filter.state = { $regex: new RegExp(state, 'i') };
    const venues = await Venue.find(filter).populate('providerId', 'name email').sort({ createdAt: -1 });
    res.json(venues);
  } catch (err) {
    res.status(500).json({ message: 'Server error searching venues' });
  }
});

// Public: single venue details  ← wildcard, MUST be after all named routes
router.get('/:id', async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id).populate('providerId', 'name email');
    if (!venue) return res.status(404).json({ message: 'Venue not found' });
    res.json(venue);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Provider: create venue
router.post('/create', authMiddleware, roleMiddleware(['PROVIDER']), async (req, res) => {
  try {
    const {
      name, state, city, address,
      latitude, longitude,
      capacity, pricePerDay,
      layoutDescription, imageUrl, venueShape,
    } = req.body;

    if (!name || !state || !city || !capacity || !pricePerDay) {
      return res.status(400).json({ message: 'Name, state, city, capacity and price are required' });
    }

    const venue = new Venue({
      providerId:        req.user.id,
      name,
      state,
      city,
      address:           address || '',
      latitude:          latitude  ? Number(latitude)  : null,
      longitude:         longitude ? Number(longitude) : null,
      capacity:          Number(capacity),
      pricePerDay:       Number(pricePerDay),
      layoutDescription: layoutDescription || '',
      images:            imageUrl ? [imageUrl] : [],
      venueShape:        venueShape || '',
    });

    await venue.save();
    res.status(201).json(venue);
  } catch (err) {
    res.status(500).json({ message: 'Server error creating venue' });
  }
});

// Provider: delete venue
router.delete('/:id', authMiddleware, roleMiddleware(['PROVIDER']), async (req, res) => {
  try {
    const venue = await Venue.findOneAndDelete({ _id: req.params.id, providerId: req.user.id });
    if (!venue) return res.status(404).json({ message: 'Venue not found or not yours' });
    res.json({ message: 'Venue deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Authenticated user: add review (Users and Organisers only, not the venue's own provider)
router.post('/:id/review', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'PROVIDER') {
      return res.status(403).json({ message: 'Venue providers cannot review their own venues' });
    }
    const { rating, text } = req.body;
    if (!rating || !text) return res.status(400).json({ message: 'Rating and text required' });

    const user  = await User.findById(req.user.id);
    const venue = await Venue.findById(req.params.id);
    if (!venue) return res.status(404).json({ message: 'Venue not found' });

    venue.reviews.push({
      userId: req.user.id,
      name:   user.name,
      rating: Number(rating),
      text,
    });
    await venue.save();
    res.json(venue.reviews[venue.reviews.length - 1]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

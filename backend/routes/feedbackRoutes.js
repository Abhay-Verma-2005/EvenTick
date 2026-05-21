const express = require('express');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const { authMiddleware } = require('../middlewares/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const list = await Feedback.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching feedback' });
  }
});

router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { rating, text } = req.body;
    if (!rating || !text) {
      return res.status(400).json({ message: 'Rating and text are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let roleLabel = 'Attendee';
    if (user.role === 'ORGANISER') roleLabel = 'Event Organiser';
    if (user.role === 'PROVIDER') roleLabel = 'Venue Provider';

    const feedback = new Feedback({
      userId: req.user.id,
      name:   user.name,
      role:   roleLabel,
      text:   text.trim(),
      rating: Number(rating),
    });

    await feedback.save();
    res.status(201).json(feedback);
  } catch (err) {
    res.status(500).json({ message: 'Server error submitting feedback' });
  }
});

module.exports = router;

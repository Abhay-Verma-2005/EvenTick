const express = require('express');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

const router = express.Router();

// USER: book tickets (quantity 1-10)
router.post('/book', authMiddleware, roleMiddleware(['USER']), async (req, res) => {
  try {
    const { eventId, quantity = 1 } = req.body;
    const qty = Math.min(10, Math.max(1, parseInt(quantity) || 1));

    const event = await Event.findById(eventId).populate('venueId');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.status !== 'Live') return res.status(400).json({ message: 'Event is not live' });
    if (event.soldTickets + qty > event.totalTickets) {
      return res.status(400).json({ message: `Only ${event.totalTickets - event.soldTickets} seats remaining` });
    }

    const activeTickets = await Ticket.find({ eventId: event._id, cancelled: false });
    const takenSeats = new Set(activeTickets.map(t => parseInt(t.seatNumber)));

    const assignedSeats = [];
    let currentSeat = 1;

    for (let i = 0; i < qty; i++) {
      while (takenSeats.has(currentSeat)) {
        currentSeat++;
      }
      assignedSeats.push(currentSeat);
      takenSeats.add(currentSeat);
    }

    const tickets = [];
    for (let i = 0; i < qty; i++) {
      const assignedSeatNum = assignedSeats[i];
      const bookingId = uuidv4();
      const qrPayload = JSON.stringify({
        bookingId,
        eventId:    event._id,
        eventTitle: event.title,
        venueName:  event.venueId?.name,
        date:       event.date,
        seat:       assignedSeatNum,
      });
      const qrCodeUrl = await QRCode.toDataURL(qrPayload);
      const ticket = new Ticket({
        userId:        req.user.id,
        eventId,
        qrCode:        qrCodeUrl,
        seatNumber:    String(assignedSeatNum),
        paymentStatus: 'SUCCESS',
        bookingId,
      });
      await ticket.save();
      tickets.push(ticket);
    }

    event.soldTickets += qty;
    await event.save();

    const populated = await Promise.all(
      tickets.map(t => t.populate({ path: 'eventId', populate: { path: 'venueId' } }))
    );
    res.status(201).json(populated.length === 1 ? populated[0] : populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// USER: cancel a ticket (only if event is > 24 hours away)
router.patch('/:id/cancel', authMiddleware, roleMiddleware(['USER']), async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, userId: req.user.id }).populate('eventId');
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (ticket.cancelled) return res.status(400).json({ message: 'Ticket already cancelled' });

    const eventDate = new Date(ticket.eventId.date);
    const hoursUntilEvent = (eventDate - new Date()) / (1000 * 60 * 60);
    if (hoursUntilEvent < 24) {
      return res.status(400).json({ message: 'Cancellation not allowed within 24 hours of the event' });
    }

    await Ticket.findByIdAndUpdate(ticket._id, {
      cancelled: true,
      cancelledAt: new Date(),
    });

    // Decrement sold count, increment cancelled count
    await Event.findByIdAndUpdate(ticket.eventId._id, {
      $inc: { soldTickets: -1, cancelledTickets: 1 },
    });

    res.json({ message: 'Ticket cancelled successfully', ticket });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// USER: get my tickets
router.get('/my-tickets', authMiddleware, roleMiddleware(['USER']), async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.user.id })
      .populate({ path: 'eventId', populate: { path: 'venueId' } })
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

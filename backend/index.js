const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const venueRoutes = require('./routes/venueRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

mongoose.connect('mongodb://127.0.0.1:27017/eventick')
  .then(() => console.log('MongoDB connected natively'))
  .catch(err => console.error(err));

// Note: Ensure /api/v1 maps correctly to frontend proxy setup.
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/venues', venueRoutes);
app.use('/api/v1/bookings', bookingRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running properly on port ${PORT} with Role-based Auth`);
});

const cron = require('node-cron');
const Event = require('./models/Event');
const Ticket = require('./models/Ticket');

cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    
    const liveEvents = await Event.find({ status: 'Live' });
    for (const event of liveEvents) {
      const targetDate = event.endDate ? new Date(event.endDate) : new Date(event.date);
      if (targetDate < now) {
        event.status = 'Completed';
        await event.save();
      }
    }

    await Ticket.updateMany(
      { cancelled: true, refundStatus: 'PENDING' },
      { refundStatus: 'REFUNDED' }
    );
  } catch (err) {
    console.error('Error in automated workflow cron:', err);
  }
});

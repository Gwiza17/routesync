require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const sequelize = require('./config/database');

// Load all models to register associations
require('./models/User');
require('./models/Driver');
require('./models/Schedule');
require('./models/Booking');
require('./models/Rating');
require('./models/TripStop');
require('./models/Message');
require('./models/DriverPassenger');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
// Note: Stripe webhook needs raw body — mount before express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/drivers', require('./routes/driver'));
app.use('/api/bookings', require('./routes/booking'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/ratings', require('./routes/rating'));
app.use('/api/earnings', require('./routes/earnings'));
app.use('/api/payments', require('./routes/payment'));

app.get('/health', (_, res) => res.json({ status: 'ok', version: '2.0' }));

// Socket.io — live driver location + in-app chat
const Message = require('./models/Message');

io.on('connection', (socket) => {

  socket.on('join:booking', ({ bookingId }) => {
    socket.join(`booking:${bookingId}`);
  });

  // ── Driver location ──────────────────────────────────────────────────────
  socket.on('driver:location', ({ bookingId, latitude, longitude }) => {
    socket.to(`booking:${bookingId}`).emit('driver:location', { latitude, longitude });
  });

  socket.on('stop:arrived', ({ bookingId, stopId }) => {
    socket.to(`booking:${bookingId}`).emit('stop:arrived', { stopId });
  });

  // ── Chat ─────────────────────────────────────────────────────────────────
  socket.on('chat:send', async ({ bookingId, senderId, senderRole, senderName, content }) => {
    try {
      if (!bookingId || !senderId || !senderRole || !content?.trim()) return;
      const msg = await Message.create({ bookingId, senderId, senderRole, content: content.trim() });
      io.to(`booking:${bookingId}`).emit('chat:message', {
        id:         msg.id,
        bookingId,
        senderId,
        senderRole,
        senderName,
        content:    msg.content,
        createdAt:  msg.createdAt,
        isRead:     false,
      });
    } catch (err) {
      socket.emit('chat:error', { message: err.message });
    }
  });

  socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 3000;
const IS_DEV = process.env.NODE_ENV !== 'production';

// alter:true breaks SQLite with FK constraints — use whenever Postgres is present
const useAlter = !!process.env.DATABASE_URL;
sequelize.sync({ alter: useAlter }).then(() => {
  server.listen(PORT, '0.0.0.0', () => console.log(`RouteSync API v2 running on port ${PORT}`));
}).catch((err) => {
  console.error('Database sync error:', err.message);
  process.exit(1);
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const sequelize = require('./config/database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/drivers', require('./routes/driver'));
app.use('/api/bookings', require('./routes/booking'));

app.get('/health', (_, res) => res.json({ status: 'ok' }));

// Socket.io — live driver location updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Driver emits their location
  socket.on('driver:location', ({ bookingId, latitude, longitude }) => {
    // Broadcast to room for that booking
    socket.to(`booking:${bookingId}`).emit('driver:location', { latitude, longitude });
  });

  // Passenger joins booking room to receive updates
  socket.on('join:booking', ({ bookingId }) => {
    socket.join(`booking:${bookingId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

sequelize.sync().then(() => {
  server.listen(PORT, '0.0.0.0', () => console.log(`RouteSync API running on port ${PORT}`));
}).catch((err) => {
  console.error('Database sync error:', err.message);
  process.exit(1);
});

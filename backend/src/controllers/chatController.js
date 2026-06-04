const Message  = require('../models/Message');
const Booking  = require('../models/Booking');
const Driver   = require('../models/Driver');
const User     = require('../models/User');
const Schedule = require('../models/Schedule');

// ── Helper — verify caller is part of the booking ─────────────────────────
async function verifyParticipant(bookingId, userId) {
  const booking = await Booking.findByPk(bookingId, {
    include: [{ model: Driver, as: 'driver' }],
  });
  if (!booking) return { booking: null, role: null };

  const isPassenger = booking.passengerId === userId;
  const isDriver    = booking.driver?.userId === userId;
  const role        = isPassenger ? 'passenger' : isDriver ? 'driver' : null;
  return { booking, role };
}

// ── GET /chat/:bookingId ─────────────────────────────────────────────────
const getMessages = async (req, res) => {
  try {
    const { booking, role } = await verifyParticipant(req.params.bookingId, req.user.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!role)    return res.status(403).json({ message: 'Not a participant in this booking' });

    const messages = await Message.findAll({
      where: { bookingId: req.params.bookingId },
      include: [{ model: User, as: 'sender', attributes: ['id', 'name'] }],
      order: [['createdAt', 'ASC']],
    });

    // Mark unread messages from the OTHER party as read
    const otherRole = role === 'passenger' ? 'driver' : 'passenger';
    await Message.update(
      { isRead: true },
      { where: { bookingId: req.params.bookingId, senderRole: otherRole, isRead: false } },
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /chat/:bookingId/call ────────────────────────────────────────────
// Initiates a masked call via Twilio Proxy so neither party's real number
// is ever revealed.  Returns a proxy phone number for each participant.
// If Twilio is not configured the response is 501 with setup instructions.
const initiateCall = async (req, res) => {
  try {
    const { booking, role } = await verifyParticipant(req.params.bookingId, req.user.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!role)    return res.status(403).json({ message: 'Not a participant in this booking' });

    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PROXY_SERVICE_SID } = process.env;
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PROXY_SERVICE_SID) {
      return res.status(501).json({
        message: 'Masked calling is not yet configured.',
        setup: 'Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PROXY_SERVICE_SID to your backend environment variables. See https://www.twilio.com/docs/proxy for setup instructions.',
      });
    }

    // Load both participants' phone numbers
    const [passenger, driverUser] = await Promise.all([
      User.findByPk(booking.passengerId, { attributes: ['id', 'name', 'phone'] }),
      User.findByPk(booking.driver.userId, { attributes: ['id', 'name', 'phone'] }),
    ]);

    if (!passenger?.phone || !driverUser?.phone) {
      return res.status(400).json({ message: 'Both participants must have a phone number registered to use masked calling.' });
    }

    const client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    // Create a Twilio Proxy session for this booking
    const sessionName = `booking-${booking.id}`;
    const session = await client.proxy.v1
      .services(TWILIO_PROXY_SERVICE_SID)
      .sessions.create({ uniqueName: sessionName, ttl: 3600 });

    await Promise.all([
      client.proxy.v1.services(TWILIO_PROXY_SERVICE_SID)
        .sessions(session.sid)
        .participants.create({ identifier: passenger.phone, friendlyName: passenger.name }),
      client.proxy.v1.services(TWILIO_PROXY_SERVICE_SID)
        .sessions(session.sid)
        .participants.create({ identifier: driverUser.phone, friendlyName: driverUser.name }),
    ]);

    // The proxy number is the same for both — Twilio routes based on who calls in
    const proxyNumber = session.proxyNumber || 'See Twilio console';

    res.json({
      proxyNumber,
      message: `Call ${proxyNumber} — your real number will not be shared.`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /chat/my — all conversations for the logged-in user ─────────────────
const getMyChats = async (req, res) => {
  try {
    const userId   = req.user.id;
    const userRole = req.user.role;
    let bookings   = [];

    if (userRole === 'passenger') {
      bookings = await Booking.findAll({
        where: { passengerId: userId },
        include: [
          { model: Driver, as: 'driver',
            include: [{ model: User, as: 'user', attributes: ['id', 'name'] }] },
          { model: Schedule, as: 'schedule', attributes: ['date', 'startTime'] },
        ],
      });
    } else {
      const driver = await Driver.findOne({ where: { userId } });
      if (!driver) return res.json([]);
      bookings = await Booking.findAll({
        where: { driverId: driver.id },
        include: [
          { model: User, as: 'passenger', attributes: ['id', 'name'] },
          { model: Driver, as: 'driver',
            include: [{ model: User, as: 'user', attributes: ['id', 'name'] }] },
          { model: Schedule, as: 'schedule', attributes: ['date', 'startTime'] },
        ],
      });
    }

    const otherRole = userRole === 'passenger' ? 'driver' : 'passenger';

    const rows = await Promise.all(bookings.map(async (booking) => {
      const [total, unread, last] = await Promise.all([
        Message.count({ where: { bookingId: booking.id } }),
        Message.count({ where: { bookingId: booking.id, senderRole: otherRole, isRead: false } }),
        Message.findOne({ where: { bookingId: booking.id }, order: [['createdAt', 'DESC']] }),
      ]);
      if (total === 0) return null;

      const otherName = userRole === 'passenger'
        ? booking.driver?.user?.name
        : booking.passenger?.name;

      return {
        bookingId:       booking.id,
        status:          booking.status,
        date:            booking.schedule?.date,
        startTime:       booking.schedule?.startTime,
        otherName,
        lastMessage:     last?.content,
        lastMessageAt:   last?.createdAt,
        lastMessageRole: last?.senderRole,
        unreadCount:     unread,
        booking:         booking.toJSON(),
      };
    }));

    const chats = rows
      .filter(Boolean)
      .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── DELETE /chat/:bookingId — delete all messages in a conversation ──────────
const deleteChat = async (req, res) => {
  try {
    const { booking, role } = await verifyParticipant(req.params.bookingId, req.user.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!role)    return res.status(403).json({ message: 'Not a participant in this booking' });

    await Message.destroy({ where: { bookingId: req.params.bookingId } });
    res.json({ message: 'Chat deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMessages, getMyChats, deleteChat, initiateCall };

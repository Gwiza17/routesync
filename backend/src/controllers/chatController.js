const Message = require('../models/Message');
const Booking = require('../models/Booking');
const Driver  = require('../models/Driver');
const User    = require('../models/User');

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

module.exports = { getMessages, initiateCall };

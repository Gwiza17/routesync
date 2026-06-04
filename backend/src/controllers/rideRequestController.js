const { Op }         = require('sequelize');
const sequelize       = require('../config/database');
const RideRequest     = require('../models/RideRequest');
const Driver          = require('../models/Driver');
const User            = require('../models/User');
const Schedule        = require('../models/Schedule');
const Booking         = require('../models/Booking');
const { haversineMiles, getDistanceAndDuration } = require('../utils/distance');
const { sendPushNotification, sendBulk }         = require('../utils/notifications');
const { getIo }       = require('../socket');

// ── POST /api/ride-requests ──────────────────────────────────────────────────
const createRideRequest = async (req, res) => {
  try {
    const {
      pickupAddress, pickupLatitude, pickupLongitude,
      dropoffAddress, dropoffLatitude, dropoffLongitude,
    } = req.body;

    if (!pickupLatitude || !pickupLongitude || !dropoffLatitude || !dropoffLongitude) {
      return res.status(400).json({ message: 'Pickup and dropoff coordinates are required' });
    }

    // Find all active pool drivers with a known home location
    const drivers = await Driver.findAll({
      where: { isActive: true, mode: 'pool', startLatitude: { [Op.ne]: null } },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'expoPushToken'] }],
    });

    const RADIUS_MILES = 15;
    const pLat = parseFloat(pickupLatitude);
    const pLng = parseFloat(pickupLongitude);

    const nearbyDrivers = drivers.filter(d => {
      const dist = haversineMiles(pLat, pLng, d.startLatitude, d.startLongitude);
      return dist <= RADIUS_MILES;
    });

    if (!nearbyDrivers.length) {
      return res.status(404).json({
        message: 'No drivers available in your area right now. Try again in a few minutes.',
      });
    }

    // Ride distance (pickup → dropoff)
    const { miles: distanceMiles } = await getDistanceAndDuration(
      pLat, pLng,
      parseFloat(dropoffLatitude), parseFloat(dropoffLongitude),
    );

    // Cost range based on the notified drivers' rates
    const rates = nearbyDrivers.map(d => parseFloat(d.ratePerMile));
    const estimatedCostMin = parseFloat((Math.min(...rates) * distanceMiles).toFixed(2));
    const estimatedCostMax = parseFloat((Math.max(...rates) * distanceMiles).toFixed(2));

    const notifiedDriverIds = nearbyDrivers.map(d => d.id);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const rideRequest = await RideRequest.create({
      passengerId: req.user.id,
      pickupAddress, pickupLatitude: pLat, pickupLongitude: pLng,
      dropoffAddress,
      dropoffLatitude:  parseFloat(dropoffLatitude),
      dropoffLongitude: parseFloat(dropoffLongitude),
      distanceMiles,
      estimatedCostMin,
      estimatedCostMax,
      notifiedDriverIds: JSON.stringify(notifiedDriverIds),
      expiresAt,
    });

    const passenger = await User.findByPk(req.user.id, { attributes: ['name'] });

    // Notify each driver via Socket.io (join:user rooms)
    const io = getIo();
    const socketPayload = {
      id: rideRequest.id,
      passengerId: req.user.id,
      passengerName: passenger.name,
      pickupAddress,
      pickupLatitude: pLat,
      pickupLongitude: pLng,
      dropoffAddress,
      dropoffLatitude:  parseFloat(dropoffLatitude),
      dropoffLongitude: parseFloat(dropoffLongitude),
      distanceMiles,
      estimatedCostMin,
      estimatedCostMax,
      expiresAt: rideRequest.expiresAt,
    };

    nearbyDrivers.forEach(d => {
      io?.to(`user:${d.userId}`).emit('ride:request', socketPayload);
    });

    // Push notifications (bulk)
    const tokens = nearbyDrivers.map(d => d.user?.expoPushToken).filter(Boolean);
    if (tokens.length) {
      await sendBulk(
        tokens,
        '🚗 New Ride Request!',
        `${passenger.name} needs a ride — ${pickupAddress}`,
        { screen: 'DriverHome', rideRequestId: rideRequest.id },
      );
    }

    res.status(201).json(rideRequest);
  } catch (err) {
    console.error('createRideRequest error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/ride-requests/:id/accept ───────────────────────────────────────
const acceptRideRequest = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    // Lock the row — first driver to reach this wins
    const rideRequest = await RideRequest.findOne({
      where: { id: req.params.id, status: 'pending' },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!rideRequest) {
      await t.rollback();
      return res.status(409).json({
        message: 'This ride has already been accepted by another driver.',
      });
    }

    if (new Date() > new Date(rideRequest.expiresAt)) {
      await rideRequest.update({ status: 'expired' }, { transaction: t });
      await t.commit();
      return res.status(410).json({ message: 'This ride request has expired.' });
    }

    const driver = await Driver.findOne({ where: { userId: req.user.id }, transaction: t });
    if (!driver) {
      await t.rollback();
      return res.status(404).json({ message: 'Driver profile not found' });
    }

    // Auto-create an on-demand schedule slot (now → now+2h)
    const now = new Date();
    const pad = n => n.toString().padStart(2, '0');
    const dateStr   = now.toISOString().split('T')[0];
    const startTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const endAt     = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const endTime   = `${pad(endAt.getHours())}:${pad(endAt.getMinutes())}`;

    const schedule = await Schedule.create({
      driverId: driver.id,
      date: dateStr,
      startTime,
      endTime,
      isBooked: true,
    }, { transaction: t });

    // Recalculate distance for this specific trip (use stored value if available)
    const distanceMiles = rideRequest.distanceMiles || (await getDistanceAndDuration(
      rideRequest.pickupLatitude, rideRequest.pickupLongitude,
      rideRequest.dropoffLatitude, rideRequest.dropoffLongitude,
    )).miles;

    const estimatedCost = parseFloat(
      (distanceMiles * parseFloat(driver.ratePerMile)).toFixed(2),
    );

    // Create booking — auto-confirmed since driver explicitly accepted
    const booking = await Booking.create({
      passengerId:      rideRequest.passengerId,
      driverId:         driver.id,
      scheduleId:       schedule.id,
      pickupAddress:    rideRequest.pickupAddress,
      pickupLatitude:   rideRequest.pickupLatitude,
      pickupLongitude:  rideRequest.pickupLongitude,
      dropoffAddress:   rideRequest.dropoffAddress,
      dropoffLatitude:  rideRequest.dropoffLatitude,
      dropoffLongitude: rideRequest.dropoffLongitude,
      leg1Miles:        0,
      leg2Miles:        distanceMiles,
      ratePerMile:      driver.ratePerMile,
      estimatedCost,
      status:           'confirmed',
    }, { transaction: t });

    await rideRequest.update({
      status:          'accepted',
      acceptedDriverId: driver.id,
      bookingId:        booking.id,
    }, { transaction: t });

    await t.commit();

    const io         = getIo();
    const driverUser  = await User.findByPk(req.user.id, { attributes: ['name', 'expoPushToken'] });

    // Tell passenger their driver is confirmed
    io?.to(`user:${rideRequest.passengerId}`).emit('ride:accepted', {
      rideRequestId: rideRequest.id,
      bookingId:     booking.id,
      driverName:    driverUser.name,
      driverCode:    driver.driverCode,
      vehicle:       driver.vehicle,
      licensePlate:  driver.licensePlate,
      ratePerMile:   driver.ratePerMile,
      estimatedCost,
      distanceMiles,
    });

    // Tell other notified drivers the ride is gone
    const notifiedIds   = JSON.parse(rideRequest.notifiedDriverIds || '[]');
    const otherDrivers  = await Driver.findAll({
      where: { id: notifiedIds.filter(id => id !== driver.id) },
      attributes: ['id', 'userId'],
    });
    otherDrivers.forEach(d => {
      io?.to(`user:${d.userId}`).emit('ride:cancelled', { rideRequestId: rideRequest.id });
    });

    // Push notification to passenger
    const passenger = await User.findByPk(rideRequest.passengerId, { attributes: ['expoPushToken'] });
    if (passenger?.expoPushToken) {
      await sendPushNotification(
        passenger.expoPushToken,
        '🎉 Driver Found!',
        `${driverUser.name} accepted your ride. They're on their way!`,
        { bookingId: booking.id, screen: 'MyTrips' },
      );
    }

    res.json({
      booking,
      driver: { ...driver.toJSON(), userName: driverUser.name },
    });
  } catch (err) {
    await t.rollback();
    console.error('acceptRideRequest error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/ride-requests/:id/decline ──────────────────────────────────────
const declineRideRequest = async (req, res) => {
  try {
    const driver = await Driver.findOne({ where: { userId: req.user.id } });
    if (!driver) return res.status(404).json({ message: 'Driver profile not found' });

    const rideRequest = await RideRequest.findByPk(req.params.id);
    if (!rideRequest || rideRequest.status !== 'pending') {
      return res.status(404).json({ message: 'Ride request not found or already resolved' });
    }

    const declined = JSON.parse(rideRequest.declinedDriverIds || '[]');
    if (!declined.includes(driver.id)) declined.push(driver.id);

    const notified    = JSON.parse(rideRequest.notifiedDriverIds || '[]');
    const allDeclined = notified.every(id => declined.includes(id));

    const updates = { declinedDriverIds: JSON.stringify(declined) };

    if (allDeclined) {
      updates.status = 'expired';
      const io = getIo();
      io?.to(`user:${rideRequest.passengerId}`).emit('ride:no_drivers', {
        rideRequestId: rideRequest.id,
      });
      const passenger = await User.findByPk(rideRequest.passengerId, { attributes: ['expoPushToken'] });
      if (passenger?.expoPushToken) {
        await sendPushNotification(
          passenger.expoPushToken,
          'No Drivers Available',
          'All nearby drivers declined your request. Try again in a few minutes.',
          {},
        );
      }
    }

    await rideRequest.update(updates);
    res.json({ declined: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── DELETE /api/ride-requests/:id (passenger cancels) ───────────────────────
const cancelRideRequest = async (req, res) => {
  try {
    const rideRequest = await RideRequest.findOne({
      where: { id: req.params.id, passengerId: req.user.id },
    });
    if (!rideRequest) return res.status(404).json({ message: 'Ride request not found' });
    if (rideRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot cancel a ride that is no longer pending' });
    }

    await rideRequest.update({ status: 'cancelled' });

    // Dismiss modal on all notified drivers
    const io         = getIo();
    const notifiedIds = JSON.parse(rideRequest.notifiedDriverIds || '[]');
    if (notifiedIds.length) {
      const drivers = await Driver.findAll({
        where: { id: notifiedIds },
        attributes: ['id', 'userId'],
      });
      drivers.forEach(d => {
        io?.to(`user:${d.userId}`).emit('ride:cancelled', { rideRequestId: rideRequest.id });
      });
    }

    res.json({ cancelled: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/ride-requests/:id ────────────────────────────────────────────────
const getRideRequest = async (req, res) => {
  try {
    const rideRequest = await RideRequest.findByPk(req.params.id, {
      include: [{ model: User, as: 'passenger', attributes: ['name'] }],
    });
    if (!rideRequest) return res.status(404).json({ message: 'Not found' });
    res.json(rideRequest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createRideRequest,
  acceptRideRequest,
  declineRideRequest,
  cancelRideRequest,
  getRideRequest,
};

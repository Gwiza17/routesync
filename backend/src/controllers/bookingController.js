const Booking = require('../models/Booking');
const Driver = require('../models/Driver');
const Schedule = require('../models/Schedule');
const User = require('../models/User');
const TripStop = require('../models/TripStop');
const { estimateTripCost, getDistanceAndDuration } = require('../utils/distance');
const { sendPushNotification } = require('../utils/notifications');

const estimateCost = async (req, res) => {
  try {
    const { driverCode, pickupLat, pickupLng, dropoffLat, dropoffLng } = req.body;
    const driver = await Driver.findOne({ where: { driverCode } });
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    const result = await estimateTripCost({
      driverLat: driver.startLatitude, driverLng: driver.startLongitude,
      pickupLat: parseFloat(pickupLat), pickupLng: parseFloat(pickupLng),
      dropoffLat: parseFloat(dropoffLat), dropoffLng: parseFloat(dropoffLng),
      ratePerMile: parseFloat(driver.ratePerMile),
    });

    res.json({ ...result, ratePerMile: driver.ratePerMile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const geocode = async (req, res) => {
  try {
    const { geocodeAddress } = require('../utils/distance');
    const { address } = req.query;
    if (!address) return res.status(400).json({ message: 'Address is required' });
    const results = await geocodeAddress(address);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createBooking = async (req, res) => {
  try {
    const {
      scheduleId,
      pickupAddress, pickupLatitude, pickupLongitude,
      dropoffAddress, dropoffLatitude, dropoffLongitude,
      stops = [],
    } = req.body;

    const schedule = await Schedule.findByPk(scheduleId);
    if (!schedule) return res.status(404).json({ message: 'Schedule slot not found' });
    if (schedule.isBooked) return res.status(400).json({ message: 'Slot already booked' });

    const driver = await Driver.findByPk(schedule.driverId);
    const driverUser = await User.findByPk(driver.userId);

    let totalMiles = 0, estimatedCost = 0, leg1Miles = 0, leg2Miles = 0;

    if (stops.length > 2) {
      // Multi-stop trip
      let runningMiles = 0;
      for (let i = 0; i < stops.length - 1; i++) {
        const { miles } = await getDistanceAndDuration(stops[i].latitude, stops[i].longitude, stops[i + 1].latitude, stops[i + 1].longitude);
        stops[i + 1].legMiles = miles;
        runningMiles += miles;
      }
      totalMiles = runningMiles;
      estimatedCost = parseFloat((totalMiles * parseFloat(driver.ratePerMile)).toFixed(2));
      leg1Miles = stops[1]?.legMiles || 0;
      leg2Miles = stops[stops.length - 1]?.legMiles || 0;
    } else {
      const result = await estimateTripCost({
        driverLat: driver.startLatitude, driverLng: driver.startLongitude,
        pickupLat: parseFloat(pickupLatitude), pickupLng: parseFloat(pickupLongitude),
        dropoffLat: parseFloat(dropoffLatitude), dropoffLng: parseFloat(dropoffLongitude),
        ratePerMile: parseFloat(driver.ratePerMile),
      });
      leg1Miles = result.leg1Miles;
      leg2Miles = result.leg2Miles;
      totalMiles = result.totalMiles;
      estimatedCost = result.estimatedCost;
    }

    const booking = await Booking.create({
      passengerId: req.user.id,
      driverId: driver.id,
      scheduleId,
      pickupAddress, pickupLatitude, pickupLongitude,
      dropoffAddress, dropoffLatitude, dropoffLongitude,
      leg1Miles, leg2Miles,
      ratePerMile: driver.ratePerMile,
      estimatedCost,
      status: 'pending',
    });

    // Create TripStop records for multi-stop
    if (stops.length > 2) {
      await Promise.all(stops.map((s, i) => TripStop.create({ bookingId: booking.id, stopOrder: i + 1, ...s })));
    }

    await schedule.update({ isBooked: true });

    // Notify driver
    const passenger = await User.findByPk(req.user.id);
    if (driverUser.expoPushToken) {
      await sendPushNotification(
        driverUser.expoPushToken,
        'New Booking Request',
        `${passenger.name} wants a ride on ${schedule.date} at ${schedule.startTime}`,
        { bookingId: booking.id, screen: 'DriverBookings' }
      );
    }

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyBookings = async (req, res) => {
  try {
    let driverId;
    if (req.user.role === 'driver') {
      const driver = await Driver.findOne({ where: { userId: req.user.id } });
      driverId = driver?.id;
    }
    const where = req.user.role === 'passenger' ? { passengerId: req.user.id } : { driverId };

    const bookings = await Booking.findAll({
      where,
      include: [
        { model: User, as: 'passenger', attributes: ['name', 'phone'] },
        { model: Driver, as: 'driver', include: [{ model: User, as: 'user', attributes: ['name'] }] },
        { model: Schedule, as: 'schedule' },
        { model: TripStop, as: 'stops', required: false },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: User, as: 'passenger' },
        { model: Driver, as: 'driver', include: [{ model: User, as: 'user' }] },
      ],
    });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const { status } = req.body;
    await booking.update({ status });

    // Push notifications on status change
    const passengerToken = booking.passenger?.expoPushToken;
    if (passengerToken) {
      const messages = {
        confirmed: { title: 'Booking Confirmed!', body: 'Your driver has accepted your booking.' },
        in_progress: { title: 'Driver On the Way!', body: 'Your trip has started. Track your driver live.' },
        completed: { title: 'Trip Complete!', body: 'Rate your driver to share your experience.' },
        cancelled: { title: 'Booking Cancelled', body: 'Your booking has been cancelled.' },
      };
      if (messages[status]) {
        await sendPushNotification(passengerToken, messages[status].title, messages[status].body, { bookingId: booking.id });
      }
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const markStopArrived = async (req, res) => {
  try {
    const stop = await TripStop.findOne({ where: { id: req.params.stopId, bookingId: req.params.id } });
    if (!stop) return res.status(404).json({ message: 'Stop not found' });
    await stop.update({ arrivedAt: new Date() });
    res.json(stop);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { estimateCost, geocode, createBooking, getMyBookings, updateBookingStatus, markStopArrived };

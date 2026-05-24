const Booking = require('../models/Booking');
const Driver = require('../models/Driver');
const Schedule = require('../models/Schedule');
const User = require('../models/User');
const { estimateTripCost } = require('../utils/distance');

const estimateCost = async (req, res) => {
  try {
    const { driverCode, pickupLat, pickupLng, dropoffLat, dropoffLng } = req.body;

    const driver = await Driver.findOne({ where: { driverCode } });
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    const result = await estimateTripCost({
      driverLat: driver.startLatitude,
      driverLng: driver.startLongitude,
      pickupLat: parseFloat(pickupLat),
      pickupLng: parseFloat(pickupLng),
      dropoffLat: parseFloat(dropoffLat),
      dropoffLng: parseFloat(dropoffLng),
      ratePerMile: parseFloat(driver.ratePerMile),
    });

    res.json({ ...result, ratePerMile: driver.ratePerMile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createBooking = async (req, res) => {
  try {
    const { scheduleId, pickupAddress, pickupLatitude, pickupLongitude, dropoffAddress, dropoffLatitude, dropoffLongitude } = req.body;

    const schedule = await Schedule.findByPk(scheduleId);
    if (!schedule) return res.status(404).json({ message: 'Schedule slot not found' });
    if (schedule.isBooked) return res.status(400).json({ message: 'Slot already booked' });

    const driver = await Driver.findByPk(schedule.driverId);

    const { leg1Miles, leg2Miles, estimatedCost } = await estimateTripCost({
      driverLat: driver.startLatitude,
      driverLng: driver.startLongitude,
      pickupLat: parseFloat(pickupLatitude),
      pickupLng: parseFloat(pickupLongitude),
      dropoffLat: parseFloat(dropoffLatitude),
      dropoffLng: parseFloat(dropoffLongitude),
      ratePerMile: parseFloat(driver.ratePerMile),
    });

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

    await schedule.update({ isBooked: true });

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const where = req.user.role === 'passenger'
      ? { passengerId: req.user.id }
      : { driverId: (await Driver.findOne({ where: { userId: req.user.id } }))?.id };

    const bookings = await Booking.findAll({
      where,
      include: [
        { model: User, as: 'passenger', attributes: ['name', 'phone'] },
        { model: Driver, as: 'driver', include: [{ model: User, as: 'user', attributes: ['name'] }] },
        { model: Schedule, as: 'schedule' },
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
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const { status } = req.body;
    await booking.update({ status });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { estimateCost, createBooking, getMyBookings, updateBookingStatus };

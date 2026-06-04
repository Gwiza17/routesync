const { Op } = require('sequelize');
const Driver = require('../models/Driver');
const User = require('../models/User');
const Schedule = require('../models/Schedule');
const { geocodeAddress } = require('../utils/distance');

// ── Haversine (straight-line miles) ─────────────────────────────────────────
const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 3958.8;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
};

// ── GET /drivers/:code ───────────────────────────────────────────────────────
const getDriverByCode = async (req, res) => {
  try {
    const driver = await Driver.findOne({
      where: { driverCode: req.params.code },
      include: [{ model: User, as: 'user', attributes: ['name', 'email', 'phone', 'avatarUrl'] }],
    });
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    res.json(driver);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /drivers/:code/schedule ──────────────────────────────────────────────
const getDriverSchedule = async (req, res) => {
  try {
    const driver = await Driver.findOne({ where: { driverCode: req.params.code } });
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    const { from, to } = req.query;
    const where = { driverId: driver.id };
    if (from && to) where.date = { [Op.between]: [from, to] };

    const slots = await Schedule.findAll({ where, order: [['date', 'ASC'], ['startTime', 'ASC']] });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /drivers/available?date=&time=&lat=&lng=&radius= ─────────────────────
const getAvailableDrivers = async (req, res) => {
  try {
    const { date, time, lat, lng, radius = 25 } = req.query;
    if (!date || !time) {
      return res.status(400).json({ message: 'date and time are required' });
    }

    // Find unbooked slots on this date that span the requested departure time
    const slots = await Schedule.findAll({
      where: {
        date,
        startTime: { [Op.lte]: time },
        endTime: { [Op.gte]: time },
        isBooked: false,
      },
      include: [
        {
          model: Driver,
          as: 'driver',
          where: { isActive: true },
          include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
        },
      ],
      order: [['startTime', 'ASC']],
    });

    // Build result list with optional distance filtering
    let results = slots.map((slot) => {
      const driver = slot.driver;
      let distanceMiles = null;

      if (lat && lng && driver.startLatitude && driver.startLongitude) {
        distanceMiles = haversine(
          parseFloat(lat),
          parseFloat(lng),
          driver.startLatitude,
          driver.startLongitude,
        );
      }

      return {
        slot: {
          id: slot.id,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
        },
        driver,
        distanceMiles,
      };
    });

    // Filter by radius (only when passenger location is known)
    if (lat && lng) {
      results = results.filter(
        (r) => r.distanceMiles === null || r.distanceMiles <= parseFloat(radius),
      );
      results.sort((a, b) => (a.distanceMiles ?? 9999) - (b.distanceMiles ?? 9999));
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /drivers/schedule ───────────────────────────────────────────────────
const addScheduleSlot = async (req, res) => {
  try {
    const driver = await Driver.findOne({ where: { userId: req.user.id } });
    if (!driver) return res.status(404).json({ message: 'Driver profile not found' });

    const { date, startTime, endTime, isRecurring, recurringDays } = req.body;
    const slot = await Schedule.create({
      driverId: driver.id,
      date,
      startTime,
      endTime,
      isRecurring,
      recurringDays,
    });
    res.status(201).json(slot);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── DELETE /drivers/schedule/:id ─────────────────────────────────────────────
const deleteScheduleSlot = async (req, res) => {
  try {
    const driver = await Driver.findOne({ where: { userId: req.user.id } });
    const slot = await Schedule.findOne({ where: { id: req.params.id, driverId: driver.id } });
    if (!slot) return res.status(404).json({ message: 'Slot not found' });
    if (slot.isBooked) return res.status(400).json({ message: 'Cannot delete a booked slot' });
    await slot.destroy();
    res.json({ message: 'Slot deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PUT /drivers/profile ─────────────────────────────────────────────────────
const updateDriverProfile = async (req, res) => {
  try {
    const driver = await Driver.findOne({ where: { userId: req.user.id } });
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    const updates = { ...req.body };

    // Geocode startAddress → store lat/lng so distance search works
    if (req.body.startAddress && req.body.startAddress !== driver.startAddress) {
      try {
        const results = await geocodeAddress(req.body.startAddress);
        if (results.length > 0) {
          updates.startAddress = results[0].address;
          updates.startLatitude = results[0].latitude;
          updates.startLongitude = results[0].longitude;
        }
      } catch (geoErr) {
        console.warn('Geocoding startAddress failed:', geoErr.message);
      }
    }

    await driver.update(updates);
    res.json(driver);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getDriverByCode,
  getDriverSchedule,
  getAvailableDrivers,
  addScheduleSlot,
  deleteScheduleSlot,
  updateDriverProfile,
};

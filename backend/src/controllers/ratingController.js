const Rating = require('../models/Rating');
const Booking = require('../models/Booking');
const Driver = require('../models/Driver');
const User = require('../models/User');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

const submitRating = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    const booking = await Booking.findByPk(bookingId, {
      include: [{ model: Driver, as: 'driver' }],
    });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.passengerId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    if (booking.status !== 'completed') return res.status(400).json({ message: 'Trip must be completed before rating' });

    const existing = await Rating.findOne({ where: { bookingId } });
    if (existing) return res.status(400).json({ message: 'Already rated this trip' });

    const newRating = await Rating.create({
      bookingId,
      reviewerId: req.user.id,
      revieweeId: booking.driver.userId,
      rating,
      comment,
    });

    // Update driver's average rating
    const stats = await Rating.findOne({
      where: { revieweeId: booking.driver.userId },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'avg'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      raw: true,
    });
    await booking.driver.update({
      averageRating: parseFloat(parseFloat(stats.avg).toFixed(1)),
      totalRatings: parseInt(stats.count),
    });

    res.status(201).json(newRating);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getDriverRatings = async (req, res) => {
  try {
    const ratings = await Rating.findAll({
      where: { revieweeId: req.params.userId },
      include: [{ model: User, as: 'reviewer', attributes: ['name'] }],
      order: [['createdAt', 'DESC']],
      limit: 20,
    });
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { submitRating, getDriverRatings };

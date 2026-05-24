const Booking = require('../models/Booking');
const Driver = require('../models/Driver');
const Schedule = require('../models/Schedule');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

const getSummary = async (req, res) => {
  try {
    const driver = await Driver.findOne({ where: { userId: req.user.id } });
    if (!driver) return res.status(404).json({ message: 'Driver profile not found' });

    const completed = await Booking.findAll({
      where: { driverId: driver.id, status: 'completed' },
      include: [{ model: Schedule, as: 'schedule' }],
    });

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const totalEarnings = completed.reduce((sum, b) => sum + parseFloat(b.finalCost || b.estimatedCost || 0), 0);
    const thisMonth = completed
      .filter(b => new Date(b.updatedAt) >= thisMonthStart)
      .reduce((sum, b) => sum + parseFloat(b.finalCost || b.estimatedCost || 0), 0);
    const lastMonth = completed
      .filter(b => new Date(b.updatedAt) >= lastMonthStart && new Date(b.updatedAt) <= lastMonthEnd)
      .reduce((sum, b) => sum + parseFloat(b.finalCost || b.estimatedCost || 0), 0);

    // Daily earnings for last 30 days
    const earningsByDay = {};
    completed
      .filter(b => new Date(b.updatedAt) >= thirtyDaysAgo)
      .forEach(b => {
        const day = b.updatedAt.toISOString().split('T')[0];
        earningsByDay[day] = (earningsByDay[day] || 0) + parseFloat(b.finalCost || b.estimatedCost || 0);
      });

    // Fill missing days with 0
    const dailyData = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      dailyData.push({ date: dateStr, amount: parseFloat((earningsByDay[dateStr] || 0).toFixed(2)) });
    }

    res.json({
      totalEarnings: parseFloat(totalEarnings.toFixed(2)),
      thisMonth: parseFloat(thisMonth.toFixed(2)),
      lastMonth: parseFloat(lastMonth.toFixed(2)),
      totalTrips: completed.length,
      earningsByDay: dailyData,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getHistory = async (req, res) => {
  try {
    const driver = await Driver.findOne({ where: { userId: req.user.id } });
    if (!driver) return res.status(404).json({ message: 'Driver profile not found' });

    const { page = 1, limit = 20 } = req.query;
    const bookings = await Booking.findAndCountAll({
      where: { driverId: driver.id, status: 'completed' },
      include: [{ model: Schedule, as: 'schedule' }],
      order: [['updatedAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.json({ bookings: bookings.rows, total: bookings.count, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getSummary, getHistory };

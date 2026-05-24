const Driver = require('../models/Driver');
const User = require('../models/User');
const Schedule = require('../models/Schedule');

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

const getDriverSchedule = async (req, res) => {
  try {
    const driver = await Driver.findOne({ where: { driverCode: req.params.code } });
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    const { from, to } = req.query;
    const where = { driverId: driver.id };
    if (from && to) {
      const { Op } = require('sequelize');
      where.date = { [Op.between]: [from, to] };
    }

    const slots = await Schedule.findAll({ where, order: [['date', 'ASC'], ['startTime', 'ASC']] });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addScheduleSlot = async (req, res) => {
  try {
    const driver = await Driver.findOne({ where: { userId: req.user.id } });
    if (!driver) return res.status(404).json({ message: 'Driver profile not found' });

    const { date, startTime, endTime, isRecurring, recurringDays } = req.body;
    const slot = await Schedule.create({ driverId: driver.id, date, startTime, endTime, isRecurring, recurringDays });
    res.status(201).json(slot);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

const updateDriverProfile = async (req, res) => {
  try {
    const driver = await Driver.findOne({ where: { userId: req.user.id } });
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    await driver.update(req.body);
    res.json(driver);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getDriverByCode, getDriverSchedule, addScheduleSlot, deleteScheduleSlot, updateDriverProfile };

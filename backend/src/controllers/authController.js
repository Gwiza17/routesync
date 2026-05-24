const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Driver = require('../models/Driver');
const { generateDriverCode } = require('../utils/driverCode');

const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, vehicle, licensePlate, ratePerMile, startAddress, startLatitude, startLongitude } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed, role, phone });

    let driver = null;
    if (role === 'driver') {
      const driverCode = generateDriverCode();
      driver = await Driver.create({
        userId: user.id,
        driverCode,
        vehicle,
        licensePlate,
        ratePerMile: parseFloat(ratePerMile),
        startAddress,
        startLatitude: parseFloat(startLatitude),
        startLongitude: parseFloat(startLongitude),
      });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, name, email, role }, driver });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Invalid credentials' });

    let driver = null;
    if (user.role === 'driver') {
      driver = await Driver.findOne({ where: { userId: user.id } });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role }, driver });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login };

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Driver = require('./Driver');
const User = require('./User');
const Schedule = require('./Schedule');

const Booking = sequelize.define('Booking', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  passengerId: { type: DataTypes.UUID, allowNull: false, references: { model: User, key: 'id' } },
  driverId: { type: DataTypes.UUID, allowNull: false, references: { model: Driver, key: 'id' } },
  scheduleId: { type: DataTypes.UUID, allowNull: false, references: { model: Schedule, key: 'id' } },

  pickupAddress: { type: DataTypes.STRING, allowNull: false },
  pickupLatitude: { type: DataTypes.FLOAT, allowNull: false },
  pickupLongitude: { type: DataTypes.FLOAT, allowNull: false },

  dropoffAddress: { type: DataTypes.STRING, allowNull: false },
  dropoffLatitude: { type: DataTypes.FLOAT, allowNull: false },
  dropoffLongitude: { type: DataTypes.FLOAT, allowNull: false },

  // Leg 1: driver start → pickup
  leg1Miles: { type: DataTypes.FLOAT },
  // Leg 2: pickup → dropoff
  leg2Miles: { type: DataTypes.FLOAT },
  ratePerMile: { type: DataTypes.DECIMAL(10, 2) },
  estimatedCost: { type: DataTypes.DECIMAL(10, 2) },
  finalCost: { type: DataTypes.DECIMAL(10, 2) },

  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'pending',
  },

  stripePaymentIntentId: { type: DataTypes.STRING },
  paidAt: { type: DataTypes.DATE },
});

Booking.belongsTo(User, { foreignKey: 'passengerId', as: 'passenger' });
Booking.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });
Booking.belongsTo(Schedule, { foreignKey: 'scheduleId', as: 'schedule' });

module.exports = Booking;

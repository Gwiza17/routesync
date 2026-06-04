const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Driver = require('./Driver');
const User   = require('./User');

// Tracks which passengers are linked to a private driver.
// Created automatically when a passenger scans the driver's QR code.
const DriverPassenger = sequelize.define('DriverPassenger', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  driverId:    { type: DataTypes.UUID, allowNull: false, references: { model: Driver, key: 'id' } },
  passengerId: { type: DataTypes.UUID, allowNull: false, references: { model: User,   key: 'id' } },
});

DriverPassenger.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });
DriverPassenger.belongsTo(User,   { foreignKey: 'passengerId', as: 'passenger' });

module.exports = DriverPassenger;

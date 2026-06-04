const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const RideRequest = sequelize.define('RideRequest', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },

  passengerId:       { type: DataTypes.UUID, allowNull: false },

  pickupAddress:     { type: DataTypes.STRING, allowNull: false },
  pickupLatitude:    { type: DataTypes.FLOAT,  allowNull: false },
  pickupLongitude:   { type: DataTypes.FLOAT,  allowNull: false },

  dropoffAddress:    { type: DataTypes.STRING, allowNull: false },
  dropoffLatitude:   { type: DataTypes.FLOAT,  allowNull: false },
  dropoffLongitude:  { type: DataTypes.FLOAT,  allowNull: false },

  distanceMiles:     { type: DataTypes.FLOAT },
  estimatedCostMin:  { type: DataTypes.FLOAT },
  estimatedCostMax:  { type: DataTypes.FLOAT },

  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'cancelled', 'expired'),
    defaultValue: 'pending',
  },

  acceptedDriverId:  { type: DataTypes.UUID },
  bookingId:         { type: DataTypes.UUID },

  // JSON arrays of driver IDs (stored as TEXT for SQLite compat)
  notifiedDriverIds: { type: DataTypes.TEXT, defaultValue: '[]' },
  declinedDriverIds: { type: DataTypes.TEXT, defaultValue: '[]' },

  expiresAt: { type: DataTypes.DATE, allowNull: false },
});

RideRequest.belongsTo(User, { foreignKey: 'passengerId', as: 'passenger' });

module.exports = RideRequest;

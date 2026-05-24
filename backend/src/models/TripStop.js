const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Booking = require('./Booking');

const TripStop = sequelize.define('TripStop', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  bookingId: { type: DataTypes.UUID, allowNull: false, references: { model: Booking, key: 'id' } },
  stopOrder: { type: DataTypes.INTEGER, allowNull: false },
  address: { type: DataTypes.STRING, allowNull: false },
  latitude: { type: DataTypes.FLOAT, allowNull: false },
  longitude: { type: DataTypes.FLOAT, allowNull: false },
  legMiles: { type: DataTypes.FLOAT },
  legDurationMinutes: { type: DataTypes.INTEGER },
  arrivedAt: { type: DataTypes.DATE },
});

TripStop.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });
Booking.hasMany(TripStop, { foreignKey: 'bookingId', as: 'stops' });

module.exports = TripStop;

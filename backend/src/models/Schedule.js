const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Driver = require('./Driver');

const Schedule = sequelize.define('Schedule', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  driverId: { type: DataTypes.UUID, allowNull: false, references: { model: Driver, key: 'id' } },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  startTime: { type: DataTypes.STRING, allowNull: false },
  endTime: { type: DataTypes.STRING, allowNull: false },
  isBooked: { type: DataTypes.BOOLEAN, defaultValue: false },
  isRecurring: { type: DataTypes.BOOLEAN, defaultValue: false },
  recurringDays: { type: DataTypes.STRING }, // JSON string e.g. "[0,1,5]" — ARRAY when using PostgreSQL
  recurringEndDate: { type: DataTypes.DATEONLY },
  seriesId: { type: DataTypes.UUID }, // Groups slots from same recurring rule
});

Schedule.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });

module.exports = Schedule;

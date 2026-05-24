const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Driver = require('./Driver');

const Schedule = sequelize.define('Schedule', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  driverId: { type: DataTypes.UUID, allowNull: false, references: { model: Driver, key: 'id' } },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  startTime: { type: DataTypes.TIME, allowNull: false },
  endTime: { type: DataTypes.TIME, allowNull: false },
  isBooked: { type: DataTypes.BOOLEAN, defaultValue: false },
  isRecurring: { type: DataTypes.BOOLEAN, defaultValue: false },
  recurringDays: { type: DataTypes.STRING }, // JSON-encoded array, e.g. "[0,1,5]"
});

Schedule.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });

module.exports = Schedule;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Driver = sequelize.define('Driver', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false, references: { model: User, key: 'id' } },
  driverCode: { type: DataTypes.STRING, allowNull: false, unique: true }, // e.g. RS-AB1234
  vehicle: { type: DataTypes.STRING },
  licensePlate: { type: DataTypes.STRING },
  ratePerMile: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  startLatitude: { type: DataTypes.FLOAT },
  startLongitude: { type: DataTypes.FLOAT },
  startAddress: { type: DataTypes.STRING },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
});

Driver.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = Driver;

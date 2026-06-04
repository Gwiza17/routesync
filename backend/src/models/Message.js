const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Booking = require('./Booking');
const User = require('./User');

const Message = sequelize.define('Message', {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  bookingId:  { type: DataTypes.UUID, allowNull: false, references: { model: Booking, key: 'id' } },
  senderId:   { type: DataTypes.UUID, allowNull: false, references: { model: User,    key: 'id' } },
  senderRole: { type: DataTypes.ENUM('driver', 'passenger'), allowNull: false },
  content:    { type: DataTypes.TEXT, allowNull: false },
  isRead:     { type: DataTypes.BOOLEAN, defaultValue: false },
});

Message.belongsTo(Booking, { foreignKey: 'bookingId' });
Message.belongsTo(User,    { foreignKey: 'senderId', as: 'sender' });

module.exports = Message;

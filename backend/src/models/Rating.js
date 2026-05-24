const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Booking = require('./Booking');

const Rating = sequelize.define('Rating', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  bookingId: { type: DataTypes.UUID, allowNull: false, unique: true, references: { model: Booking, key: 'id' } },
  reviewerId: { type: DataTypes.UUID, allowNull: false, references: { model: User, key: 'id' } },
  revieweeId: { type: DataTypes.UUID, allowNull: false, references: { model: User, key: 'id' } },
  rating: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  comment: { type: DataTypes.TEXT },
});

Rating.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });
Rating.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });
Rating.belongsTo(User, { foreignKey: 'revieweeId', as: 'reviewee' });

module.exports = Rating;

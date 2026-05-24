const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, { dialect: 'postgres', logging: false })
  : new Sequelize({ dialect: 'sqlite', storage: path.join(__dirname, '../../routesync.db'), logging: false });

module.exports = sequelize;

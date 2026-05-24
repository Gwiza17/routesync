const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;

if (process.env.DATABASE_URL) {
  // PostgreSQL (Neon, Supabase, Railway, or local)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: process.env.DATABASE_URL.includes('sslmode=require') || process.env.DATABASE_URL.includes('neon.tech')
        ? { require: true, rejectUnauthorized: false }
        : false,
    },
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
  });
} else {
  // SQLite fallback for local dev without Postgres
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../routesync.db'),
    logging: false,
  });
}

module.exports = sequelize;

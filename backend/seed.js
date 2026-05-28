/**
 * RouteSync — Dev Seed Script
 * Creates one test passenger and one test driver with schedule slots.
 * Run: node seed.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('./src/config/database');

// Register all models
require('./src/models/User');
require('./src/models/Driver');
require('./src/models/Schedule');
require('./src/models/Booking');
require('./src/models/Rating');
require('./src/models/TripStop');

const User     = require('./src/models/User');
const Driver   = require('./src/models/Driver');
const Schedule = require('./src/models/Schedule');

const TEST_PASSWORD = 'Test1234!';

async function seed() {
  await sequelize.sync({ force: true }); // wipe + recreate tables
  console.log('✅ Database synced (fresh)');

  const hashed = await bcrypt.hash(TEST_PASSWORD, 12);

  /* ── Test Passenger ─────────────────────────────── */
  const passengerUser = await User.create({
    name:     'Chanda Passenger',
    email:    'passenger@routesync.dev',
    password: hashed,
    role:     'passenger',
    phone:    '+13175550001',
  });

  /* ── Test Driver ────────────────────────────────── */
  const driverUser = await User.create({
    name:     'Marcus Driver',
    email:    'driver@routesync.dev',
    password: hashed,
    role:     'driver',
    phone:    '+13175550002',
  });

  const driver = await Driver.create({
    userId:         driverUser.id,
    driverCode:     'RS-TEST1',
    vehicle:        'Toyota Camry 2023',
    licensePlate:   'IN-TEST-01',
    ratePerMile:    1.85,
    startAddress:   '4821 Carmel Dr, Carmel, IN 46033',
    startLatitude:  39.9589,
    startLongitude: -86.0064,
    isActive:       true,
    averageRating:  4.97,
    totalRatings:   142,
  });

  /* ── Schedule slots for next 7 days ─────────────── */
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    // Morning slot
    await Schedule.create({
      driverId:  driver.id,
      date:      dateStr,
      startTime: '08:00',
      endTime:   '12:00',
      isBooked:  false,
    });

    // Afternoon slot
    await Schedule.create({
      driverId:  driver.id,
      date:      dateStr,
      startTime: '13:00',
      endTime:   '18:00',
      isBooked:  false,
    });
  }

  console.log('\n🌱 Seed complete! Test accounts:\n');
  console.log('  👤 PASSENGER');
  console.log('     Email:    passenger@routesync.dev');
  console.log('     Password: Test1234!\n');
  console.log('  🚗 DRIVER');
  console.log('     Email:    driver@routesync.dev');
  console.log('     Password: Test1234!');
  console.log('     Driver ID: RS-TEST1\n');
  console.log('  14 schedule slots created (next 7 days, AM + PM each day)\n');

  await sequelize.close();
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});

require('dotenv').config({ quiet: true });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const { hashPassword } = require('../utils/password');
const { seedMeals } = require('../services/SeederService');
const { DEMO_PASSWORD, demoRestaurants } = require('./demoData');

async function upsertManager(manager) {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  return User.findOneAndUpdate(
    { email: manager.email },
    {
      ...manager,
      passwordHash,
      role: 'manager',
      managerStatus: 'approved',
      setupCompleted: true,
      mustChangePassword: false,
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
}

async function upsertRestaurant(restaurant, manager) {
  const savedRestaurant = await Restaurant.findOneAndUpdate(
    { vatNumber: restaurant.vatNumber },
    {
      name: restaurant.name,
      address: restaurant.address,
      city: restaurant.city,
      zip: restaurant.zip,
      phone: restaurant.phone,
      vatNumber: restaurant.vatNumber,
      managerId: manager._id,
      location: restaurant.location,
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  await User.updateOne(
    { _id: manager._id },
    { $set: { restaurantId: savedRestaurant._id } }
  );
}

async function seedDemoData() {
  await seedMeals();

  for (const restaurant of demoRestaurants) {
    const manager = await upsertManager(restaurant.manager);
    await upsertRestaurant(restaurant, manager);
  }

  return demoRestaurants.length;
}

async function run() {
  await connectDB();
  try {
    const count = await seedDemoData();
    console.log(`[DEMO] ${count} ristoranti di Citta Studi caricati.`);
  } finally {
    await mongoose.disconnect();
  }
}

module.exports = { seedDemoData, upsertManager, upsertRestaurant };

if (require.main === module) {
  run().catch((error) => {
    console.error('Errore durante il seed demo:', error.message);
    process.exit(1);
  });
}

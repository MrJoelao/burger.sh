require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Dish = require('../models/Dish');
const meals = require('./meal.json');

/* carica in "dishes" i piatti comuni della catena, definiti in meal.json e
   condivisi da tutte le filiali (requirements.md §4). lo script è idempotente:
   un piatto già presente (stesso nome, non custom) viene aggiornato invece
   che duplicato, così può essere rilanciato in sicurezza dopo aver modificato
   meal.json senza creare doppioni a ogni riavvio del setup. */
async function seedMeals() {
  await connectDB();

  const seededDishes = await Promise.all(
    meals.map((meal) =>
      Dish.findOneAndUpdate(
        { name: meal.name, isCustom: false },
        { ...meal, isCustom: false, restaurantId: null },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      )
    )
  );

  console.log(`Seed completato: ${seededDishes.length} piatti comuni caricati.`);

  await mongoose.disconnect();
}

seedMeals().catch((error) => {
  console.error('Errore durante il seed dei piatti:', error.message);
  process.exit(1);
});

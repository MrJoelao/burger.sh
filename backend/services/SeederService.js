/* burger.sh — dish seeding service */
const Dish = require('../models/Dish');
const meals = require('../scripts/meal.json');

/* seed common dishes (idempotent upsert) */
async function seedMeals() {
  const seededDishes = await Promise.all(
    meals.map((meal) =>
      Dish.findOneAndUpdate(
        { name: meal.name, isCustom: false },
        { ...meal, isCustom: false, restaurantId: null },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      )
    )
  );
  console.log(`[SETUP] ${seededDishes.length} piatti comuni caricati.`);
  return seededDishes;
}

/* seed default dishes (alias for seedMeals) */
async function seedDefaultDishes() {
  return seedMeals();
}

module.exports = {
  seedMeals,
  seedDefaultDishes,
};
const request = require('supertest');
const app = require('../../app');
const dbHandler = require('../helpers/dbHandler');
const {
  createManager,
  createRestaurant,
  createIngredient,
  tokenFor
} = require('../helpers/factories');
const Ingredient = require('../../models/Ingredient');

beforeAll(dbHandler.connect);
afterEach(dbHandler.clearDatabase);
afterAll(dbHandler.closeDatabase);

test('chiudendo una filiale elimina gli ingredienti privati e conserva quelli pubblici', async () => {
  const manager = await createManager();
  const restaurant = await createRestaurant({ managerId: manager._id });
  const privateIngredient = await createIngredient({ restaurantId: restaurant._id });
  const publicIngredient = await createIngredient({ restaurantId: null });

  const response = await request(app)
    .delete(`/api/restaurants/${restaurant._id}`)
    .set('Authorization', `Bearer ${tokenFor(manager)}`);

  expect(response.status).toBe(200);
  await expect(Ingredient.findById(privateIngredient._id)).resolves.toBeNull();
  await expect(Ingredient.findById(publicIngredient._id)).resolves.not.toBeNull();
});

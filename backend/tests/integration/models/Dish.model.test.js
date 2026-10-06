const dbHandler = require('../../helpers/dbHandler');
const Dish = require('../../../models/Dish');

/* test di integrazione per il modello Dish: verifica campi obbligatori,
   vincolo price >= 0 e i default di isCustom e restaurantId. */

beforeAll(dbHandler.connect);
afterEach(dbHandler.clearDatabase);
afterAll(dbHandler.closeDatabase);

describe('Dish model', () => {
  test('crea un piatto valido con tutti i campi richiesti', async () => {
    const dish = await Dish.create({
      name: 'Cheeseburger',
      type: 'burger',
      price: 7.5
    });

    expect(dish._id).toBeDefined();
    expect(dish.name).toBe('Cheeseburger');
    expect(dish.createdAt).toBeDefined();
  });

  test('rifiuta un piatto senza name', async () => {
    await expect(Dish.create({
      type: 'burger',
      price: 7.5
    })).rejects.toThrow();
  });

  test('rifiuta un piatto senza type', async () => {
    await expect(Dish.create({
      name: 'Cheeseburger',
      price: 7.5
    })).rejects.toThrow();
  });

  test('rifiuta un piatto senza price', async () => {
    await expect(Dish.create({
      name: 'Cheeseburger',
      type: 'burger'
    })).rejects.toThrow();
  });

  test('rifiuta un piatto con price negativo', async () => {
    await expect(Dish.create({
      name: 'Cheeseburger',
      type: 'burger',
      price: -1
    })).rejects.toThrow();
  });

  test('applica isCustom false come default', async () => {
    const dish = await Dish.create({
      name: 'Cheeseburger',
      type: 'burger',
      price: 7.5
    });

    expect(dish.isCustom).toBe(false);
  });

  test('applica restaurantId null come default', async () => {
    const dish = await Dish.create({
      name: 'Cheeseburger',
      type: 'burger',
      price: 7.5
    });

    expect(dish.restaurantId).toBeNull();
  });
});

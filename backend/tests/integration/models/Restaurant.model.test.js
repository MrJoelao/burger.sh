const dbHandler = require('../../helpers/dbHandler');
const Restaurant = require('../../../models/Restaurant');
const { createManager } = require('../../helpers/factories');

/* test di integrazione per il modello Restaurant: verifica campi
   obbligatori e il riferimento managerId come ObjectId. */

beforeAll(dbHandler.connect);
afterEach(dbHandler.clearDatabase);
afterAll(dbHandler.closeDatabase);

describe('Restaurant model', () => {
  test('crea un ristorante valido con tutti i campi richiesti', async () => {
    const manager = await createManager();

    const restaurant = await Restaurant.create({
      name: 'Burger House',
      address: 'Via Roma 1',
      city: 'Milano',
      phone: '+39 02 1234567',
      vatNumber: 'IT00000001',
      managerId: manager._id
    });

    expect(restaurant._id).toBeDefined();
    expect(restaurant.managerId.toString()).toBe(manager._id.toString());
    expect(restaurant.createdAt).toBeDefined();
  });

  test('rifiuta un ristorante senza name', async () => {
    const manager = await createManager();

    await expect(Restaurant.create({
      address: 'Via Roma 1',
      city: 'Milano',
      phone: '+39 02 1234567',
      vatNumber: 'IT00000001',
      managerId: manager._id
    })).rejects.toThrow();
  });

  test('rifiuta un ristorante senza address', async () => {
    const manager = await createManager();

    await expect(Restaurant.create({
      name: 'Burger House',
      city: 'Milano',
      phone: '+39 02 1234567',
      vatNumber: 'IT00000001',
      managerId: manager._id
    })).rejects.toThrow();
  });

  test('rifiuta un ristorante senza city', async () => {
    const manager = await createManager();

    await expect(Restaurant.create({
      name: 'Burger House',
      address: 'Via Roma 1',
      phone: '+39 02 1234567',
      vatNumber: 'IT00000001',
      managerId: manager._id
    })).rejects.toThrow();
  });

  test('rifiuta un ristorante senza phone', async () => {
    const manager = await createManager();

    await expect(Restaurant.create({
      name: 'Burger House',
      address: 'Via Roma 1',
      city: 'Milano',
      vatNumber: 'IT00000001',
      managerId: manager._id
    })).rejects.toThrow();
  });

  test('rifiuta un ristorante senza vatNumber', async () => {
    const manager = await createManager();

    await expect(Restaurant.create({
      name: 'Burger House',
      address: 'Via Roma 1',
      city: 'Milano',
      phone: '+39 02 1234567',
      managerId: manager._id
    })).rejects.toThrow();
  });

  test('rifiuta un ristorante senza managerId', async () => {
    await expect(Restaurant.create({
      name: 'Burger House',
      address: 'Via Roma 1',
      city: 'Milano',
      phone: '+39 02 1234567',
      vatNumber: 'IT00000001'
    })).rejects.toThrow();
  });
});

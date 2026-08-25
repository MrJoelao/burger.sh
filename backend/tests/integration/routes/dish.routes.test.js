const request = require('supertest');
const app = require('../../../app');
const dbHandler = require('../../helpers/dbHandler');
const {
  createUser,
  createManager,
  createAdmin,
  createRestaurant,
  createDish,
  createIngredient,
  tokenFor
} = require('../../helpers/factories');
const Dish = require('../../../models/Dish');

/* test di integrazione delle rotte dei piatti: lettura pubblica (con
   paginazione), e scrittura protetta con regole di autorizzazione diverse
   tra admin, manager proprietario/non proprietario e customer. */

beforeAll(dbHandler.connect);
afterEach(dbHandler.clearDatabase);
afterAll(dbHandler.closeDatabase);

describe('GET /api/dishes', () => {
  test('restituisce la lista paginata dei piatti con status 200', async () => {
    await createDish({ name: 'Panino 1' });
    await createDish({ name: 'Panino 2' });

    const response = await request(app).get('/api/dishes');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.pagination.total).toBe(2);
  });

  test('rispetta i parametri di paginazione page e limit', async () => {
    await createDish();
    await createDish();
    await createDish();

    const response = await request(app).get('/api/dishes?page=2&limit=2');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.pagination.page).toBe(2);
    expect(response.body.pagination.totalPages).toBe(2);
  });

  test('filtra per nome con match parziale case-insensitive', async () => {
    await createDish({ name: 'Cheeseburger' });
    await createDish({ name: 'Patatine' });

    const response = await request(app).get('/api/dishes?name=cheese');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe('Cheeseburger');
  });

  test('filtra per tipologia con match parziale case-insensitive', async () => {
    await createDish({ type: 'burger' });
    await createDish({ type: 'drink' });

    const response = await request(app).get('/api/dishes?type=BUR');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].type).toBe('burger');
  });

  test('filtra per fascia di prezzo con minPrice e maxPrice', async () => {
    await createDish({ price: 3 });
    await createDish({ price: 8 });
    await createDish({ price: 15 });

    const response = await request(app).get('/api/dishes?minPrice=5&maxPrice=10');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].price).toBe(8);
  });

  test('rifiuta con 400 un minPrice non numerico', async () => {
    const response = await request(app).get('/api/dishes?minPrice=abc');

    expect(response.status).toBe(400);
  });

  test('filtra per ingrediente con match parziale case-insensitive', async () => {
    const lattuga = await createIngredient({ name: 'Lattuga' });
    const pomodoro = await createIngredient({ name: 'Pomodoro' });
    await createDish({ name: 'Con lattuga', ingredientIds: [lattuga._id] });
    await createDish({ name: 'Con pomodoro', ingredientIds: [pomodoro._id] });

    const response = await request(app).get('/api/dishes?ingredient=lattu');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe('Con lattuga');
  });

  test('esclude i piatti con un ingrediente che contiene l\'allergene cercato', async () => {
    const glutine = await createIngredient({ name: 'Farina', allergens: ['glutine'] });
    const senzaAllergeni = await createIngredient({ name: 'Insalata', allergens: [] });
    await createDish({ name: 'Panino', ingredientIds: [glutine._id] });
    await createDish({ name: 'Insalatona', ingredientIds: [senzaAllergeni._id] });

    const response = await request(app).get('/api/dishes?allergen=glutine');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe('Insalatona');
  });
});

describe('GET /api/dishes/restaurant/:restaurantId', () => {
  test('restituisce i piatti standard e i custom del ristorante', async () => {
    const restaurant = await createRestaurant();
    const otherRestaurant = await createRestaurant();

    await createDish({ isCustom: false });
    await createDish({ isCustom: true, restaurantId: restaurant._id });
    await createDish({ isCustom: true, restaurantId: otherRestaurant._id });

    const response = await request(app).get(`/api/dishes/restaurant/${restaurant._id}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
  });
});

describe('GET /api/dishes/:id', () => {
  test('restituisce 200 con i dati del piatto popolato per un piatto esistente', async () => {
    const dish = await createDish();

    const response = await request(app).get(`/api/dishes/${dish._id}`);

    expect(response.status).toBe(200);
    expect(response.body.data._id).toBe(dish._id.toString());
  });

  test('restituisce 404 per un id inesistente', async () => {
    const fakeId = '64b7a0f9a1234567890abcde';

    const response = await request(app).get(`/api/dishes/${fakeId}`);

    expect(response.status).toBe(404);
  });
});

describe('POST /api/dishes', () => {
  test('un admin autorizzato crea il piatto con successo', async () => {
    const admin = await createAdmin();

    const response = await request(app)
      .post('/api/dishes')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ name: 'Cheeseburger', type: 'burger', price: 8 });

    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe('Cheeseburger');
  });

  test('un manager proprietario autorizzato crea il piatto custom con successo', async () => {
    const manager = await createManager();
    const restaurant = await createRestaurant({ managerId: manager._id });

    const response = await request(app)
      .post('/api/dishes')
      .set('Authorization', `Bearer ${tokenFor(manager)}`)
      .send({
        name: 'Panino Speciale',
        type: 'burger',
        price: 9,
        isCustom: true,
        restaurantId: restaurant._id.toString()
      });

    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe('Panino Speciale');
  });

  test('un manager non proprietario riceve 403 nel creare un piatto custom di un altro ristorante', async () => {
    const manager = await createManager();
    const otherManager = await createManager();
    const restaurant = await createRestaurant({ managerId: otherManager._id });

    const response = await request(app)
      .post('/api/dishes')
      .set('Authorization', `Bearer ${tokenFor(manager)}`)
      .send({
        name: 'Panino Speciale',
        type: 'burger',
        price: 9,
        isCustom: true,
        restaurantId: restaurant._id.toString()
      });

    expect(response.status).toBe(403);
  });

  test('un customer riceve 403 nel creare un piatto', async () => {
    const customer = await createUser();

    const response = await request(app)
      .post('/api/dishes')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ name: 'Cheeseburger', type: 'burger', price: 8 });

    expect(response.status).toBe(403);
  });

  test('un manager proprietario con managerStatus "pending" riceve 403 nel creare un piatto custom', async () => {
    const manager = await createManager({ managerStatus: 'pending' });
    const restaurant = await createRestaurant({ managerId: manager._id });

    const response = await request(app)
      .post('/api/dishes')
      .set('Authorization', `Bearer ${tokenFor(manager)}`)
      .send({
        name: 'Panino Speciale',
        type: 'burger',
        price: 9,
        isCustom: true,
        restaurantId: restaurant._id.toString()
      });

    expect(response.status).toBe(403);
  });

  test('rifiuta con 400 un piatto custom senza restaurantId', async () => {
    const admin = await createAdmin();

    const response = await request(app)
      .post('/api/dishes')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ name: 'Panino Speciale', type: 'burger', price: 9, isCustom: true });

    expect(response.status).toBe(400);
  });
});

describe('PUT /api/dishes/:id', () => {
  test('un admin autorizzato modifica il piatto con successo', async () => {
    const admin = await createAdmin();
    const dish = await createDish();

    const response = await request(app)
      .put(`/api/dishes/${dish._id}`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ price: 12 });

    expect(response.status).toBe(200);
    expect(response.body.data.price).toBe(12);

    const updatedDish = await Dish.findById(dish._id);
    expect(updatedDish.price).toBe(12);
  });

  test('il manager proprietario autorizzato modifica il piatto custom con successo', async () => {
    const manager = await createManager();
    const restaurant = await createRestaurant({ managerId: manager._id });
    const dish = await createDish({ isCustom: true, restaurantId: restaurant._id });

    const response = await request(app)
      .put(`/api/dishes/${dish._id}`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`)
      .send({ price: 15 });

    expect(response.status).toBe(200);
    expect(response.body.data.price).toBe(15);

    const updatedDish = await Dish.findById(dish._id);
    expect(updatedDish.price).toBe(15);
  });

  test('un manager non proprietario riceve 403 nel modificare un piatto custom altrui', async () => {
    const manager = await createManager();
    const otherManager = await createManager();
    const restaurant = await createRestaurant({ managerId: otherManager._id });
    const dish = await createDish({ isCustom: true, restaurantId: restaurant._id });

    const response = await request(app)
      .put(`/api/dishes/${dish._id}`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`)
      .send({ price: 15 });

    expect(response.status).toBe(403);
  });

  test('un customer riceve 403 nel modificare un piatto', async () => {
    const customer = await createUser();
    const dish = await createDish();

    const response = await request(app)
      .put(`/api/dishes/${dish._id}`)
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ price: 15 });

    expect(response.status).toBe(403);
  });

  test('un manager proprietario con managerStatus "pending" riceve 403', async () => {
    const manager = await createManager({ managerStatus: 'pending' });
    const restaurant = await createRestaurant({ managerId: manager._id });
    const dish = await createDish({ isCustom: true, restaurantId: restaurant._id });

    const response = await request(app)
      .put(`/api/dishes/${dish._id}`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`)
      .send({ price: 15 });

    expect(response.status).toBe(403);
  });
});

describe('DELETE /api/dishes/:id', () => {
  test('un admin può eliminare un piatto standard', async () => {
    const admin = await createAdmin();
    const dish = await createDish();

    const response = await request(app)
      .delete(`/api/dishes/${dish._id}`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`);

    expect(response.status).toBe(200);
  });

  test('il manager proprietario può eliminare un piatto custom del proprio ristorante', async () => {
    const manager = await createManager();
    const restaurant = await createRestaurant({ managerId: manager._id });
    const dish = await createDish({ isCustom: true, restaurantId: restaurant._id });

    const response = await request(app)
      .delete(`/api/dishes/${dish._id}`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`);

    expect(response.status).toBe(200);
  });

  test('un manager non proprietario riceve 403 nell\'eliminare un piatto custom altrui', async () => {
    const manager = await createManager();
    const otherManager = await createManager();
    const restaurant = await createRestaurant({ managerId: otherManager._id });
    const dish = await createDish({ isCustom: true, restaurantId: restaurant._id });

    const response = await request(app)
      .delete(`/api/dishes/${dish._id}`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`);

    expect(response.status).toBe(403);
  });

  test('un customer riceve 403 nell\'eliminare un piatto', async () => {
    const customer = await createUser();
    const dish = await createDish();

    const response = await request(app)
      .delete(`/api/dishes/${dish._id}`)
      .set('Authorization', `Bearer ${tokenFor(customer)}`);

    expect(response.status).toBe(403);
  });

  test('un manager proprietario con managerStatus "pending" riceve 403', async () => {
    const manager = await createManager({ managerStatus: 'pending' });
    const restaurant = await createRestaurant({ managerId: manager._id });
    const dish = await createDish({ isCustom: true, restaurantId: restaurant._id });

    const response = await request(app)
      .delete(`/api/dishes/${dish._id}`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`);

    expect(response.status).toBe(403);
  });
});

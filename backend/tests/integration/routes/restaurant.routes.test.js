const request = require('supertest');
const app = require('../../../app');
const dbHandler = require('../../helpers/dbHandler');
const {
  createUser,
  createManager,
  createAdmin,
  createRestaurant,
  createDish,
  tokenFor
} = require('../../helpers/factories');

/* test di integrazione delle rotte dei ristoranti: lettura pubblica
   (lista e dettaglio) e scrittura riservata ad admin/manager proprietario. */

beforeAll(dbHandler.connect);
afterEach(dbHandler.clearDatabase);
afterAll(dbHandler.closeDatabase);

describe('GET /api/restaurants', () => {
  test('restituisce la lista pubblica dei ristoranti con status 200', async () => {
    await createRestaurant();
    await createRestaurant();

    const response = await request(app).get('/api/restaurants');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
  });

  test('filtra per nome con match parziale case-insensitive', async () => {
    await createRestaurant({ name: 'Burger House' });
    await createRestaurant({ name: 'Pizzeria Napoli' });

    const response = await request(app).get('/api/restaurants?name=burger');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe('Burger House');
  });

  test('filtra per città con match parziale case-insensitive', async () => {
    await createRestaurant({ city: 'Milano' });
    await createRestaurant({ city: 'Torino' });

    const response = await request(app).get('/api/restaurants?city=mila');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].city).toBe('Milano');
  });

  test('filtra per ristorante che offre un piatto custom con quel nome', async () => {
    const restaurant = await createRestaurant();
    const otherRestaurant = await createRestaurant();
    await createDish({ name: 'Panino Speciale', isCustom: true, restaurantId: restaurant._id });
    await createDish({ name: 'Insalatona', isCustom: true, restaurantId: otherRestaurant._id });

    const response = await request(app).get('/api/restaurants?dishName=speciale');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]._id).toBe(restaurant._id.toString());
  });

  test('un piatto del menu comune con quel nome rende tutti i ristoranti idonei', async () => {
    await createRestaurant();
    await createRestaurant();
    await createDish({ name: 'Cheeseburger', isCustom: false });

    const response = await request(app).get('/api/restaurants?dishName=cheeseburger');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
  });

  test('restituisce una lista vuota se nessun piatto corrisponde al nome cercato', async () => {
    await createRestaurant();

    const response = await request(app).get('/api/restaurants?dishName=inesistente');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(0);
  });

  test('combina i filtri di nome e città', async () => {
    await createRestaurant({ name: 'Burger House', city: 'Milano' });
    await createRestaurant({ name: 'Burger House', city: 'Torino' });

    const response = await request(app).get('/api/restaurants?name=burger&city=torino');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].city).toBe('Torino');
  });
});

describe('GET /api/restaurants/:id', () => {
  test('restituisce il dettaglio pubblico del ristorante con status 200', async () => {
    const restaurant = await createRestaurant();

    const response = await request(app).get(`/api/restaurants/${restaurant._id}`);

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe(restaurant.name);
  });

  test('restituisce 404 per un id inesistente', async () => {
    const fakeId = '64b7a0f9a1234567890abcde';

    const response = await request(app).get(`/api/restaurants/${fakeId}`);

    expect(response.status).toBe(404);
  });
});

describe('POST /api/restaurants', () => {
  test('un admin può creare un ristorante con un managerId valido', async () => {
    const admin = await createAdmin();
    const manager = await createManager();

    const response = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({
        name: 'Burger House',
        address: 'Via Roma 1',
        city: 'Milano',
        phone: '+39 02 1234567',
        vatNumber: 'IT00000001',
        managerId: manager._id.toString()
      });

    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe('Burger House');
  });

  test('un non admin riceve 403 nel creare un ristorante', async () => {
    const manager = await createManager();
    const otherManager = await createManager();

    const response = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${tokenFor(manager)}`)
      .send({
        name: 'Burger House',
        address: 'Via Roma 1',
        city: 'Milano',
        phone: '+39 02 1234567',
        vatNumber: 'IT00000001',
        managerId: otherManager._id.toString()
      });

    expect(response.status).toBe(403);
  });

  test('rifiuta con 400 se managerId non appartiene a un manager', async () => {
    const admin = await createAdmin();
    const customer = await createUser();

    const response = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({
        name: 'Burger House',
        address: 'Via Roma 1',
        city: 'Milano',
        phone: '+39 02 1234567',
        vatNumber: 'IT00000001',
        managerId: customer._id.toString()
      });

    expect(response.status).toBe(400);
  });
});

describe('PUT /api/restaurants/:id', () => {
  test('un admin può modificare qualsiasi ristorante', async () => {
    const admin = await createAdmin();
    const restaurant = await createRestaurant();

    const response = await request(app)
      .put(`/api/restaurants/${restaurant._id}`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ city: 'Torino' });

    expect(response.status).toBe(200);
    expect(response.body.data.city).toBe('Torino');
  });

  test('il manager proprietario può modificare il proprio ristorante', async () => {
    const manager = await createManager();
    const restaurant = await createRestaurant({ managerId: manager._id });

    const response = await request(app)
      .put(`/api/restaurants/${restaurant._id}`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`)
      .send({ city: 'Napoli' });

    expect(response.status).toBe(200);
    expect(response.body.data.city).toBe('Napoli');
  });

  test('un manager non proprietario riceve 403', async () => {
    const manager = await createManager();
    const restaurant = await createRestaurant();

    const response = await request(app)
      .put(`/api/restaurants/${restaurant._id}`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`)
      .send({ city: 'Napoli' });

    expect(response.status).toBe(403);
  });

  test('un customer riceve 403', async () => {
    const customer = await createUser();
    const restaurant = await createRestaurant();

    const response = await request(app)
      .put(`/api/restaurants/${restaurant._id}`)
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ city: 'Napoli' });

    expect(response.status).toBe(403);
  });

  test('un manager proprietario con managerStatus "pending" riceve 403', async () => {
    const manager = await createManager({ managerStatus: 'pending' });
    const restaurant = await createRestaurant({ managerId: manager._id });

    const response = await request(app)
      .put(`/api/restaurants/${restaurant._id}`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`)
      .send({ city: 'Napoli' });

    expect(response.status).toBe(403);
  });

  test('il manager proprietario non può trasferire il ristorante cambiando managerId', async () => {
    const manager = await createManager();
    const otherManager = await createManager();
    const restaurant = await createRestaurant({ managerId: manager._id });

    const response = await request(app)
      .put(`/api/restaurants/${restaurant._id}`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`)
      .send({ city: 'Napoli', managerId: otherManager._id.toString() });

    expect(response.status).toBe(200);
    expect(response.body.data.managerId._id.toString()).toBe(manager._id.toString());
  });

  test('cambiare address invalida la location geocodificata in cache', async () => {
    const admin = await createAdmin();
    const restaurant = await createRestaurant({ location: { lat: 45.0, lng: 9.0 } });

    const response = await request(app)
      .put(`/api/restaurants/${restaurant._id}`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ address: 'Via Nuova 99' });

    expect(response.status).toBe(200);
    expect(response.body.data.location).toBeUndefined();
  });

  test('cambiare solo il nome non tocca la location geocodificata in cache', async () => {
    const admin = await createAdmin();
    const restaurant = await createRestaurant({ location: { lat: 45.0, lng: 9.0 } });

    const response = await request(app)
      .put(`/api/restaurants/${restaurant._id}`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ name: 'Nuovo Nome' });

    expect(response.status).toBe(200);
    expect(response.body.data.location).toEqual({ lat: 45.0, lng: 9.0 });
  });
});

describe('DELETE /api/restaurants/:id', () => {
  test('un admin può eliminare un ristorante', async () => {
    const admin = await createAdmin();
    const restaurant = await createRestaurant();

    const response = await request(app)
      .delete(`/api/restaurants/${restaurant._id}`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`);

    expect(response.status).toBe(200);
  });

  test('il manager proprietario può chiudere la propria filiale senza chiudere l\'account', async () => {
    const manager = await createManager();
    const restaurant = await createRestaurant({ managerId: manager._id });

    const response = await request(app)
      .delete(`/api/restaurants/${restaurant._id}`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`);

    expect(response.status).toBe(200);

    const User = require('../../../models/User');
    const stillExists = await User.findById(manager._id);
    expect(stillExists).not.toBeNull();
  });

  test('il manager proprietario può trasferire la filiale con newManagerId invece di chiuderla', async () => {
    const manager = await createManager();
    const newManager = await createManager({ managerStatus: 'approved' });
    const restaurant = await createRestaurant({ managerId: manager._id });

    const response = await request(app)
      .delete(`/api/restaurants/${restaurant._id}`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`)
      .send({ newManagerId: newManager._id.toString() });

    expect(response.status).toBe(200);

    const Restaurant = require('../../../models/Restaurant');
    const transferred = await Restaurant.findById(restaurant._id);
    expect(transferred.managerId.toString()).toBe(newManager._id.toString());
  });

  test('un manager non proprietario riceve 403 nell\'eliminare un ristorante altrui', async () => {
    const manager = await createManager();
    const restaurant = await createRestaurant();

    const response = await request(app)
      .delete(`/api/restaurants/${restaurant._id}`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`);

    expect(response.status).toBe(403);
  });

  test('un customer riceve 403 nell\'eliminare un ristorante', async () => {
    const customer = await createUser();
    const restaurant = await createRestaurant();

    const response = await request(app)
      .delete(`/api/restaurants/${restaurant._id}`)
      .set('Authorization', `Bearer ${tokenFor(customer)}`);

    expect(response.status).toBe(403);
  });
});

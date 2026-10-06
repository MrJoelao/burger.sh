const request = require('supertest');
const app = require('../../../app');
const dbHandler = require('../../helpers/dbHandler');
const { createUser, createRestaurant, createDish, tokenFor } = require('../../helpers/factories');
const osmService = require('../../../services/osmService');

/* test di integrazione delle rotte del carrello (/api/cart): stessa
   collezione orders degli ordini confermati (status 'draft'), ma un ciclo
   di vita e una risorsa http a sé, separati da /api/orders. mocka
   osmService come order.routes.test.js: nessun test deve contattare
   davvero Nominatim per confermare un carrello a domicilio. */
jest.mock('../../../services/osmService');

beforeAll(dbHandler.connect);
afterEach(dbHandler.clearDatabase);
afterAll(dbHandler.closeDatabase);

beforeEach(() => {
  osmService.geocodeAddress.mockResolvedValue({ lat: 45.01, lng: 9.01 });
});

describe('POST /api/cart/items', () => {
  test('crea un nuovo carrello calcolando unitPrice dal prezzo attuale del piatto', async () => {
    const customer = await createUser();
    const restaurant = await createRestaurant();
    const dish = await createDish({ price: 8.5 });

    const response = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ restaurantId: restaurant._id.toString(), dishId: dish._id.toString(), quantity: 2 });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('draft');
    expect(response.body.data.orderItems).toHaveLength(1);
    expect(response.body.data.orderItems[0].unitPrice).toBe(8.5);
    expect(response.body.data.totalAmount).toBe(17);
  });

  test('ignora un eventuale unitPrice inviato dal client, usando sempre quello reale del piatto', async () => {
    const customer = await createUser();
    const restaurant = await createRestaurant();
    const dish = await createDish({ price: 8.5 });

    const response = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ restaurantId: restaurant._id.toString(), dishId: dish._id.toString(), quantity: 1, unitPrice: 0.01 });

    expect(response.status).toBe(200);
    expect(response.body.data.orderItems[0].unitPrice).toBe(8.5);
  });

  test('somma la quantity se il piatto è già nel carrello, invece di duplicare la riga', async () => {
    const customer = await createUser();
    const restaurant = await createRestaurant();
    const dish = await createDish({ price: 8.5 });
    const authHeader = `Bearer ${tokenFor(customer)}`;

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', authHeader)
      .send({ restaurantId: restaurant._id.toString(), dishId: dish._id.toString(), quantity: 1 });

    const response = await request(app)
      .post('/api/cart/items')
      .set('Authorization', authHeader)
      .send({ restaurantId: restaurant._id.toString(), dishId: dish._id.toString(), quantity: 2 });

    expect(response.status).toBe(200);
    expect(response.body.data.orderItems).toHaveLength(1);
    expect(response.body.data.orderItems[0].quantity).toBe(3);
  });

  test('rifiuta con 409 un piatto di un altro ristorante quando esiste già un carrello aperto', async () => {
    const customer = await createUser();
    const restaurant = await createRestaurant();
    const otherRestaurant = await createRestaurant();
    const dish = await createDish();
    const authHeader = `Bearer ${tokenFor(customer)}`;

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', authHeader)
      .send({ restaurantId: restaurant._id.toString(), dishId: dish._id.toString(), quantity: 1 });

    const response = await request(app)
      .post('/api/cart/items')
      .set('Authorization', authHeader)
      .send({ restaurantId: otherRestaurant._id.toString(), dishId: dish._id.toString(), quantity: 1 });

    expect(response.status).toBe(409);
  });

  test('rifiuta con 400 un piatto custom di un\'altra filiale', async () => {
    const customer = await createUser();
    const restaurant = await createRestaurant();
    const otherRestaurant = await createRestaurant();
    const dishOfAnotherRestaurant = await createDish({ isCustom: true, restaurantId: otherRestaurant._id });

    const response = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ restaurantId: restaurant._id.toString(), dishId: dishOfAnotherRestaurant._id.toString(), quantity: 1 });

    expect(response.status).toBe(400);
  });
});

describe('GET /api/cart', () => {
  test('restituisce il carrello attivo del cliente', async () => {
    const customer = await createUser();
    const restaurant = await createRestaurant();
    const dish = await createDish();
    const authHeader = `Bearer ${tokenFor(customer)}`;

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', authHeader)
      .send({ restaurantId: restaurant._id.toString(), dishId: dish._id.toString(), quantity: 1 });

    const response = await request(app).get('/api/cart').set('Authorization', authHeader);

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('draft');
  });

  test('restituisce 404 se il cliente non ha un carrello attivo', async () => {
    const customer = await createUser();

    const response = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${tokenFor(customer)}`);

    expect(response.status).toBe(404);
  });
});

describe('PATCH /api/cart/items/:dishId', () => {
  test('aggiorna la quantity e ricalcola il totale', async () => {
    const customer = await createUser();
    const restaurant = await createRestaurant();
    const dish = await createDish({ price: 8.5 });
    const authHeader = `Bearer ${tokenFor(customer)}`;

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', authHeader)
      .send({ restaurantId: restaurant._id.toString(), dishId: dish._id.toString(), quantity: 1 });

    const response = await request(app)
      .patch(`/api/cart/items/${dish._id}`)
      .set('Authorization', authHeader)
      .send({ quantity: 4 });

    expect(response.status).toBe(200);
    expect(response.body.data.orderItems[0].quantity).toBe(4);
    expect(response.body.data.totalAmount).toBe(34);
  });

  test('restituisce 404 se il piatto non è nel carrello', async () => {
    const customer = await createUser();
    const restaurant = await createRestaurant();
    const dish = await createDish();
    const otherDish = await createDish();
    const authHeader = `Bearer ${tokenFor(customer)}`;

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', authHeader)
      .send({ restaurantId: restaurant._id.toString(), dishId: dish._id.toString(), quantity: 1 });

    const response = await request(app)
      .patch(`/api/cart/items/${otherDish._id}`)
      .set('Authorization', authHeader)
      .send({ quantity: 2 });

    expect(response.status).toBe(404);
  });

  test('restituisce 404 se il cliente non ha un carrello attivo', async () => {
    const customer = await createUser();
    const dish = await createDish();

    const response = await request(app)
      .patch(`/api/cart/items/${dish._id}`)
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ quantity: 2 });

    expect(response.status).toBe(404);
  });
});

describe('DELETE /api/cart/items/:dishId', () => {
  test('rimuove un piatto e ricalcola il totale sulle righe rimanenti', async () => {
    const customer = await createUser();
    const restaurant = await createRestaurant();
    const dish = await createDish({ price: 8.5 });
    const otherDish = await createDish({ price: 4 });
    const authHeader = `Bearer ${tokenFor(customer)}`;

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', authHeader)
      .send({ restaurantId: restaurant._id.toString(), dishId: dish._id.toString(), quantity: 1 });
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', authHeader)
      .send({ restaurantId: restaurant._id.toString(), dishId: otherDish._id.toString(), quantity: 1 });

    const response = await request(app)
      .delete(`/api/cart/items/${dish._id}`)
      .set('Authorization', authHeader);

    expect(response.status).toBe(200);
    expect(response.body.data.orderItems).toHaveLength(1);
    expect(response.body.data.totalAmount).toBe(4);
  });

  test('svuota il carrello riportando il totale a zero quando si rimuove l\'ultimo piatto', async () => {
    const customer = await createUser();
    const restaurant = await createRestaurant();
    const dish = await createDish({ price: 8.5 });
    const authHeader = `Bearer ${tokenFor(customer)}`;

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', authHeader)
      .send({ restaurantId: restaurant._id.toString(), dishId: dish._id.toString(), quantity: 1 });

    const response = await request(app)
      .delete(`/api/cart/items/${dish._id}`)
      .set('Authorization', authHeader);

    expect(response.status).toBe(200);
    expect(response.body.data.orderItems).toHaveLength(0);
    expect(response.body.data.totalAmount).toBe(0);
  });
});

describe('DELETE /api/cart', () => {
  test('elimina il carrello del cliente', async () => {
    const customer = await createUser();
    const restaurant = await createRestaurant();
    const dish = await createDish();
    const authHeader = `Bearer ${tokenFor(customer)}`;

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', authHeader)
      .send({ restaurantId: restaurant._id.toString(), dishId: dish._id.toString(), quantity: 1 });

    const deleteResponse = await request(app).delete('/api/cart').set('Authorization', authHeader);
    expect(deleteResponse.status).toBe(200);

    const getResponse = await request(app).get('/api/cart').set('Authorization', authHeader);
    expect(getResponse.status).toBe(404);
  });

  test('restituisce 404 se il cliente non ha un carrello attivo', async () => {
    const customer = await createUser();

    const response = await request(app)
      .delete('/api/cart')
      .set('Authorization', `Bearer ${tokenFor(customer)}`);

    expect(response.status).toBe(404);
  });
});

describe('POST /api/cart/confirm', () => {
  test('conferma un carrello pickup, portandolo in stato "ordered"', async () => {
    const customer = await createUser();
    const restaurant = await createRestaurant();
    const dish = await createDish();
    const authHeader = `Bearer ${tokenFor(customer)}`;

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', authHeader)
      .send({ restaurantId: restaurant._id.toString(), dishId: dish._id.toString(), quantity: 1 });

    const response = await request(app)
      .post('/api/cart/confirm')
      .set('Authorization', authHeader)
      .send({ mode: 'pickup' });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('ordered');
    expect(response.body.data.mode).toBe('pickup');
  });

  test('conferma un carrello delivery solo se viene fornito l\'indirizzo di consegna', async () => {
    const customer = await createUser();
    const restaurant = await createRestaurant();
    const dish = await createDish();
    const authHeader = `Bearer ${tokenFor(customer)}`;

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', authHeader)
      .send({ restaurantId: restaurant._id.toString(), dishId: dish._id.toString(), quantity: 1 });

    const missingDelivery = await request(app)
      .post('/api/cart/confirm')
      .set('Authorization', authHeader)
      .send({ mode: 'delivery' });
    expect(missingDelivery.status).toBe(400);

    const response = await request(app)
      .post('/api/cart/confirm')
      .set('Authorization', authHeader)
      .send({ mode: 'delivery', delivery: { address: 'Via Roma 1' } });

    expect(response.status).toBe(200);
    expect(response.body.data.mode).toBe('delivery');
    expect(response.body.data.delivery.address).toBe('Via Roma 1');
  });

  test('rifiuta con 400 la conferma di un carrello senza piatti', async () => {
    const customer = await createUser();
    const restaurant = await createRestaurant();
    const dish = await createDish();
    const authHeader = `Bearer ${tokenFor(customer)}`;

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', authHeader)
      .send({ restaurantId: restaurant._id.toString(), dishId: dish._id.toString(), quantity: 1 });
    await request(app).delete(`/api/cart/items/${dish._id}`).set('Authorization', authHeader);

    const response = await request(app)
      .post('/api/cart/confirm')
      .set('Authorization', authHeader)
      .send({ mode: 'pickup' });

    expect(response.status).toBe(400);
  });

  test('restituisce 404 se il cliente non ha un carrello attivo', async () => {
    const customer = await createUser();

    const response = await request(app)
      .post('/api/cart/confirm')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ mode: 'pickup' });

    expect(response.status).toBe(404);
  });
});

const request = require('supertest');
const app = require('../../../app');
const dbHandler = require('../../helpers/dbHandler');
const {
  createUser,
  createManager,
  createAdmin,
  createRestaurant,
  createDish,
  createOrder,
  tokenFor
} = require('../../helpers/factories');
const Order = require('../../../models/Order');

/* test di integrazione delle rotte degli ordini. attenzione: diversi
   endpoint restituiscono un errore 500 a causa di bug reali del codice
   sorgente (non modificabile), quindi i test verificano il comportamento
   effettivo dell'applicazione invece di quello "atteso":

   1) updateOrderStatus usa una mappa validTransitions con le chiavi
      'ritiro'/'delivery', ma il modello usa mode 'pickup'/'delivery':
      per un ordine con mode 'pickup', validTransitions['pickup'] è
      undefined e il codice lancia un TypeError, gestito come 500.
   2) createOrder, updateOrderStatus (caso valido) e confirmDelivery
      concatenano due populate su un documento (es. order.populate().
      populate()), non supportato da questa versione di mongoose: la
      scrittura sul database va a buon fine, ma la risposta è 500.
   3) getOrderById confronta order.customerId.toString() (documento
      popolato) con req.user.id: il confronto è sempre "diverso", quindi
      valuta anche order.restaurantId.managerId (undefined, perché il
      populate seleziona solo name/city) e lancia un TypeError: la
      risposta è sempre 500 quando l'ordine esiste, per qualsiasi
      chiamante. */

beforeAll(dbHandler.connect);
afterEach(dbHandler.clearDatabase);
afterAll(dbHandler.closeDatabase);

describe('POST /api/orders', () => {
  test('crea l\'ordine usando req.user.id come customerId, pur rispondendo 500 per il bug di populate', async () => {
    const customer = await createUser();
    const restaurant = await createRestaurant();
    const dish = await createDish();

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({
        // richiesti dallo schema Joi anche se il controller userà req.user.id
        customerId: customer._id.toString(),
        restaurantId: restaurant._id.toString(),
        orderItems: [{ dishId: dish._id.toString(), quantity: 1, unitPrice: 8.5 }],
        mode: 'pickup',
        totalAmount: 8.5,
        orderCode: 'FF-CREATE01'
      });

    expect(response.status).toBe(500);

    // nota: il controller genera un proprio orderCode con generateOrderCode(),
    // ignorando quello inviato nel payload, quindi si cerca per customerId
    const savedOrder = await Order.findOne({ customerId: customer._id });
    expect(savedOrder).not.toBeNull();
    expect(savedOrder.customerId.toString()).toBe(customer._id.toString());
  });

  test('rifiuta un payload non valido restituendo 400', async () => {
    const customer = await createUser();

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ customerId: customer._id.toString() });

    expect(response.status).toBe(400);
  });
});

describe('GET /api/orders/user', () => {
  test('restituisce gli ordini del cliente autenticato', async () => {
    const customer = await createUser();
    await createOrder({ customerId: customer._id });
    await createOrder(); // ordine di un altro cliente, non deve comparire

    const response = await request(app)
      .get('/api/orders/user')
      .set('Authorization', `Bearer ${tokenFor(customer)}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });
});

describe('GET /api/orders/restaurant/:restaurantId', () => {
  test('il manager proprietario vede gli ordini del proprio ristorante', async () => {
    const manager = await createManager();
    const restaurant = await createRestaurant({ managerId: manager._id });
    await createOrder({ restaurantId: restaurant._id });

    const response = await request(app)
      .get(`/api/orders/restaurant/${restaurant._id}`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });

  test('un admin vede gli ordini di qualsiasi ristorante', async () => {
    const admin = await createAdmin();
    const restaurant = await createRestaurant();
    await createOrder({ restaurantId: restaurant._id });

    const response = await request(app)
      .get(`/api/orders/restaurant/${restaurant._id}`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });

  test('un manager non proprietario riceve 403', async () => {
    const manager = await createManager();
    const restaurant = await createRestaurant();

    const response = await request(app)
      .get(`/api/orders/restaurant/${restaurant._id}`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`);

    expect(response.status).toBe(403);
  });
});

describe('GET /api/orders/:id', () => {
  /* vedi la nota generale sopra: il controllo di autorizzazione crasha
     sempre quando l'ordine esiste, indipendentemente da chi lo richiede. */
  test('restituisce 500 anche per il cliente proprietario, a causa del bug di autorizzazione', async () => {
    const customer = await createUser();
    const order = await createOrder({ customerId: customer._id });

    const response = await request(app)
      .get(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${tokenFor(customer)}`);

    expect(response.status).toBe(500);
  });

  test('restituisce 500 anche per un admin, a causa del bug di autorizzazione', async () => {
    const admin = await createAdmin();
    const order = await createOrder();

    const response = await request(app)
      .get(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`);

    expect(response.status).toBe(500);
  });

  test('restituisce 404 "Order not found" per un id inesistente', async () => {
    const customer = await createUser();
    const fakeId = '64b7a0f9a1234567890abcde';

    const response = await request(app)
      .get(`/api/orders/${fakeId}`)
      .set('Authorization', `Bearer ${tokenFor(customer)}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Order not found');
  });
});

describe('PATCH /api/orders/:id/status', () => {
  test('un ordine con mode "pickup" causa un errore 500 non gestito (bug noto di validTransitions)', async () => {
    const manager = await createManager();
    const restaurant = await createRestaurant({ managerId: manager._id });
    const order = await createOrder({ restaurantId: restaurant._id, mode: 'pickup' });

    const response = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`)
      .send({ status: 'preparing' });

    expect(response.status).toBe(500);
  });

  test('un ordine "delivery" con transizione valida aggiorna lo stato nel db, pur rispondendo 500 per il bug di populate', async () => {
    const manager = await createManager();
    const restaurant = await createRestaurant({ managerId: manager._id });
    const order = await createOrder({
      restaurantId: restaurant._id,
      mode: 'delivery',
      delivery: { address: 'Via Milano 5' }
    });

    const response = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`)
      .send({ status: 'preparing' });

    expect(response.status).toBe(500);

    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder.status).toBe('preparing');
  });

  test('un ordine "delivery" con transizione non valida restituisce 400', async () => {
    const manager = await createManager();
    const restaurant = await createRestaurant({ managerId: manager._id });
    const order = await createOrder({
      restaurantId: restaurant._id,
      mode: 'delivery',
      delivery: { address: 'Via Milano 5' }
    });

    const response = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`)
      .send({ status: 'ready' });

    expect(response.status).toBe(400);
  });

  test('un manager non proprietario riceve 403', async () => {
    const manager = await createManager();
    const restaurant = await createRestaurant();
    const order = await createOrder({ restaurantId: restaurant._id, mode: 'delivery', delivery: { address: 'x' } });

    const response = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`)
      .send({ status: 'preparing' });

    expect(response.status).toBe(403);
  });
});

describe('PATCH /api/orders/:id/confirm-delivery', () => {
  test('il cliente proprietario conferma la consegna nel db, pur rispondendo 500 per il bug di populate', async () => {
    const customer = await createUser();
    const restaurant = await createRestaurant();
    const order = await createOrder({
      customerId: customer._id,
      restaurantId: restaurant._id,
      mode: 'delivery',
      status: 'on_delivery',
      delivery: { address: 'Via Milano 5' }
    });

    const response = await request(app)
      .patch(`/api/orders/${order._id}/confirm-delivery`)
      .set('Authorization', `Bearer ${tokenFor(customer)}`);

    expect(response.status).toBe(500);

    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder.status).toBe('delivered');
  });

  test('un cliente diverso dal proprietario riceve 403', async () => {
    const customer = await createUser();
    const otherCustomer = await createUser();
    const order = await createOrder({
      customerId: customer._id,
      mode: 'delivery',
      status: 'on_delivery',
      delivery: { address: 'Via Milano 5' }
    });

    const response = await request(app)
      .patch(`/api/orders/${order._id}/confirm-delivery`)
      .set('Authorization', `Bearer ${tokenFor(otherCustomer)}`);

    expect(response.status).toBe(403);
  });

  test('rifiuta con 400 la conferma di un ordine mode "pickup"', async () => {
    const customer = await createUser();
    const order = await createOrder({
      customerId: customer._id,
      mode: 'pickup',
      status: 'ready'
    });

    const response = await request(app)
      .patch(`/api/orders/${order._id}/confirm-delivery`)
      .set('Authorization', `Bearer ${tokenFor(customer)}`);

    expect(response.status).toBe(400);
  });

  test('rifiuta con 400 la conferma di un ordine non ancora "on_delivery"', async () => {
    const customer = await createUser();
    const order = await createOrder({
      customerId: customer._id,
      mode: 'delivery',
      status: 'preparing',
      delivery: { address: 'Via Milano 5' }
    });

    const response = await request(app)
      .patch(`/api/orders/${order._id}/confirm-delivery`)
      .set('Authorization', `Bearer ${tokenFor(customer)}`);

    expect(response.status).toBe(400);
  });
});

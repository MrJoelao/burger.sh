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

// test di integrazione delle rotte degli ordini

beforeAll(dbHandler.connect);
afterEach(dbHandler.clearDatabase);
afterAll(dbHandler.closeDatabase);

describe('POST /api/orders', () => {
  test('crea l\'ordine usando req.user.id come customerId', async () => {
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

    expect(response.status).toBe(201);

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

  test('un manager proprietario con managerStatus "pending" riceve 403', async () => {
    const manager = await createManager({ managerStatus: 'pending' });
    const restaurant = await createRestaurant({ managerId: manager._id });

    const response = await request(app)
      .get(`/api/orders/restaurant/${restaurant._id}`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`);

    expect(response.status).toBe(403);
  });
});

describe('GET /api/orders/restaurant/:restaurantId/dashboard', () => {
  test('il manager proprietario vede incassi, ordini per stato e piatti più venduti', async () => {
    const manager = await createManager();
    const restaurant = await createRestaurant({ managerId: manager._id });
    const dish = await createDish({ name: 'Cheeseburger' });

    await createOrder({
      restaurantId: restaurant._id,
      status: 'delivered',
      totalAmount: 10,
      orderItems: [{ dishId: dish._id, quantity: 2, unitPrice: 5 }]
    });
    await createOrder({ restaurantId: restaurant._id, status: 'preparing' });

    const response = await request(app)
      .get(`/api/orders/restaurant/${restaurant._id}/dashboard`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`);

    expect(response.status).toBe(200);
    expect(response.body.data.revenue).toBe(10);
    expect(response.body.data.ordersByStatus.delivered).toBe(1);
    expect(response.body.data.ordersByStatus.preparing).toBe(1);
    expect(response.body.data.topDishes[0]).toMatchObject({
      name: 'Cheeseburger',
      quantitySold: 2
    });
  });

  test('un admin vede la dashboard di qualsiasi ristorante', async () => {
    const admin = await createAdmin();
    const restaurant = await createRestaurant();

    const response = await request(app)
      .get(`/api/orders/restaurant/${restaurant._id}/dashboard`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`);

    expect(response.status).toBe(200);
    expect(response.body.data.revenue).toBe(0);
  });

  test('un manager non proprietario riceve 403', async () => {
    const manager = await createManager();
    const restaurant = await createRestaurant();

    const response = await request(app)
      .get(`/api/orders/restaurant/${restaurant._id}/dashboard`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`);

    expect(response.status).toBe(403);
  });

  test('un manager proprietario con managerStatus "pending" riceve 403', async () => {
    const manager = await createManager({ managerStatus: 'pending' });
    const restaurant = await createRestaurant({ managerId: manager._id });

    const response = await request(app)
      .get(`/api/orders/restaurant/${restaurant._id}/dashboard`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`);

    expect(response.status).toBe(403);
  });

  test('restituisce 404 per un ristorante inesistente', async () => {
    const admin = await createAdmin();
    const fakeId = '64b7a0f9a1234567890abcde';

    const response = await request(app)
      .get(`/api/orders/restaurant/${fakeId}/dashboard`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`);

    expect(response.status).toBe(404);
  });
});

describe('GET /api/orders/:id', () => {
  test('il cliente proprietario vede il proprio ordine', async () => {
    const customer = await createUser();
    const order = await createOrder({ customerId: customer._id });

    const response = await request(app)
      .get(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${tokenFor(customer)}`);

    expect(response.status).toBe(200);
  });

  test('un admin vede qualsiasi ordine', async () => {
    const admin = await createAdmin();
    const order = await createOrder();

    const response = await request(app)
      .get(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`);

    expect(response.status).toBe(200);
  });

  test('un cliente diverso dal proprietario riceve 404', async () => {
    const otherCustomer = await createUser();
    const order = await createOrder();

    const response = await request(app)
      .get(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${tokenFor(otherCustomer)}`);

    expect(response.status).toBe(404);
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
  test('un ordine "pickup" con transizione valida aggiorna lo stato', async () => {
    const manager = await createManager();
    const restaurant = await createRestaurant({ managerId: manager._id });
    const order = await createOrder({ restaurantId: restaurant._id, mode: 'pickup' });

    const response = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`)
      .send({ status: 'preparing' });

    expect(response.status).toBe(200);

    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder.status).toBe('preparing');
  });

  test('un ordine "delivery" con transizione valida aggiorna lo stato', async () => {
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

    expect(response.status).toBe(200);

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

  test('un manager proprietario con managerStatus "pending" riceve 403', async () => {
    const manager = await createManager({ managerStatus: 'pending' });
    const restaurant = await createRestaurant({ managerId: manager._id });
    const order = await createOrder({ restaurantId: restaurant._id, mode: 'pickup' });

    const response = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`)
      .send({ status: 'preparing' });

    expect(response.status).toBe(403);
  });

  test('rifiuta con 400 un salto di stato che non passa per gli stati intermedi', async () => {
    const manager = await createManager();
    const restaurant = await createRestaurant({ managerId: manager._id });
    const order = await createOrder({
      restaurantId: restaurant._id,
      mode: 'delivery',
      status: 'ordered',
      delivery: { address: 'Via Milano 5' }
    });

    const response = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`)
      .send({ status: 'delivered' });

    expect(response.status).toBe(400);

    const untouchedOrder = await Order.findById(order._id);
    expect(untouchedOrder.status).toBe('ordered');
  });

  test('rifiuta con 400 un tentativo di tornare a uno stato precedente', async () => {
    const manager = await createManager();
    const restaurant = await createRestaurant({ managerId: manager._id });
    const order = await createOrder({
      restaurantId: restaurant._id,
      mode: 'pickup',
      status: 'ready'
    });

    const response = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`)
      .send({ status: 'preparing' });

    expect(response.status).toBe(400);
  });
});

describe('PATCH /api/orders/:id/confirm-delivery', () => {
  test('il cliente proprietario conferma la consegna', async () => {
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

    expect(response.status).toBe(200);

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

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
const osmService = require('../../../services/osmService');

/* mocka osmService: nessun test di integrazione deve contattare davvero
   Nominatim. restituisce coordinate leggermente diverse a ogni chiamata così
   il calcolo della distanza per gli ordini a domicilio non è mai 0 */
jest.mock('../../../services/osmService');

// test di integrazione delle rotte degli ordini

beforeAll(dbHandler.connect);
afterEach(dbHandler.clearDatabase);
afterAll(dbHandler.closeDatabase);

beforeEach(() => {
  let callCount = 0;
  osmService.geocodeAddress.mockImplementation(async () => {
    callCount += 1;
    return { lat: 45.0 + callCount * 0.01, lng: 9.0 + callCount * 0.01 };
  });
});

describe('POST /api/orders', () => {
  test('crea l\'ordine usando req.user.id come customerId', async () => {
    const customer = await createUser();
    const restaurant = await createRestaurant();
    const dish = await createDish();

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({
        restaurantId: restaurant._id.toString(),
        orderItems: [{ dishId: dish._id.toString(), quantity: 1, unitPrice: 8.5 }],
        mode: 'pickup',
        totalAmount: 8.5
      });

    expect(response.status).toBe(201);

    const savedOrder = await Order.findOne({ customerId: customer._id });
    expect(savedOrder).not.toBeNull();
    expect(savedOrder.customerId.toString()).toBe(customer._id.toString());
  });

  test('rifiuta un payload non valido restituendo 400', async () => {
    const customer = await createUser();

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ mode: 'pickup' });

    expect(response.status).toBe(400);
  });

  test('rifiuta con 400 se un piatto custom non appartiene al ristorante scelto', async () => {
    const customer = await createUser();
    const restaurant = await createRestaurant();
    const otherRestaurant = await createRestaurant();
    // piatto custom di un'altra filiale: non ordinabile presso "restaurant"
    const dishOfAnotherRestaurant = await createDish({ isCustom: true, restaurantId: otherRestaurant._id });

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({
        restaurantId: restaurant._id.toString(),
        orderItems: [{ dishId: dishOfAnotherRestaurant._id.toString(), quantity: 1, unitPrice: 8.5 }],
        mode: 'pickup',
        totalAmount: 8.5
      });

    expect(response.status).toBe(400);

    const savedOrder = await Order.findOne({ customerId: customer._id });
    expect(savedOrder).toBeNull();
  });

  test('accetta un piatto custom quando appartiene al ristorante scelto', async () => {
    const customer = await createUser();
    const restaurant = await createRestaurant();
    const customDish = await createDish({ isCustom: true, restaurantId: restaurant._id });

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({
        restaurantId: restaurant._id.toString(),
        orderItems: [{ dishId: customDish._id.toString(), quantity: 1, unitPrice: 8.5 }],
        mode: 'pickup',
        totalAmount: 8.5
      });

    expect(response.status).toBe(201);
  });

  test('ignora unitPrice e totalAmount manomessi dal client, usando sempre il prezzo reale del piatto', async () => {
    const customer = await createUser();
    const restaurant = await createRestaurant();
    const dish = await createDish({ price: 8.5 });

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({
        restaurantId: restaurant._id.toString(),
        // il cliente prova a dichiarare un prezzo unitario e un totale più bassi di quello reale
        orderItems: [{ dishId: dish._id.toString(), quantity: 2, unitPrice: 0.01 }],
        mode: 'pickup',
        totalAmount: 0.02
      });

    expect(response.status).toBe(201);
    expect(response.body.data.orderItems[0].unitPrice).toBe(8.5);
    expect(response.body.data.totalAmount).toBe(17);

    const savedOrder = await Order.findOne({ customerId: customer._id });
    expect(savedOrder.totalAmount).toBe(17);
    expect(savedOrder.orderItems[0].unitPrice).toBe(8.5);
  });

  test('calcola distanceKm e deliveryFee lato server, ignorando un deliveryFee manomesso a 0 dal client', async () => {
    const customer = await createUser();
    const restaurant = await createRestaurant();
    const dish = await createDish({ price: 8.5 });

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({
        restaurantId: restaurant._id.toString(),
        orderItems: [{ dishId: dish._id.toString(), quantity: 1, unitPrice: 8.5 }],
        mode: 'delivery',
        totalAmount: 8.5,
        // il cliente prova a dichiarare una consegna gratuita: il campo non è nemmeno accettato dallo schema
        delivery: { address: 'Via Milano 5', distanceKm: 0, deliveryFee: 0 }
      });

    expect(response.status).toBe(201);
    expect(response.body.data.delivery.address).toBe('Via Milano 5');
    expect(response.body.data.delivery.deliveryFee).toBeGreaterThan(0);
    expect(response.body.data.delivery.distanceKm).toBeGreaterThan(0);
  });

  test('rifiuta con 422 un ordine a domicilio con indirizzo non geocodificabile', async () => {
    const customer = await createUser();
    const restaurant = await createRestaurant();
    const dish = await createDish({ price: 8.5 });

    osmService.geocodeAddress.mockRejectedValueOnce(
      Object.assign(new Error('Address not found'), { statusCode: 422 })
    );

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({
        restaurantId: restaurant._id.toString(),
        orderItems: [{ dishId: dish._id.toString(), quantity: 1, unitPrice: 8.5 }],
        mode: 'delivery',
        totalAmount: 8.5,
        delivery: { address: 'indirizzo inesistente' }
      });

    expect(response.status).toBe(422);

    const savedOrder = await Order.findOne({ customerId: customer._id });
    expect(savedOrder).toBeNull();
  });
});

/* il carrello in bozza ha una risorsa e una suite di test dedicate
   (/api/cart, vedi cart.routes.test.js). qui restano solo i due test che
   verificano che un carrello non trapeli nelle liste/dashboard degli ordini
   confermati, perché esercitano il filtro di orderService, non il carrello. */
describe('Un carrello in bozza non compare tra gli ordini confermati', () => {
  test('non compare tra gli ordini del cliente, nemmeno con status=current', async () => {
    const customer = await createUser();
    const restaurant = await createRestaurant();
    const dish = await createDish();
    const authHeader = `Bearer ${tokenFor(customer)}`;

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', authHeader)
      .send({ restaurantId: restaurant._id.toString(), dishId: dish._id.toString(), quantity: 1 });

    const allOrders = await request(app).get('/api/orders/user').set('Authorization', authHeader);
    expect(allOrders.body.data).toHaveLength(0);

    const currentOrders = await request(app).get('/api/orders/user?status=current').set('Authorization', authHeader);
    expect(currentOrders.body.data).toHaveLength(0);
  });

  test('non compare tra gli ordini della filiale del manager', async () => {
    const manager = await createManager();
    const restaurant = await createRestaurant({ managerId: manager._id });
    const customer = await createUser();
    const dish = await createDish();

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ restaurantId: restaurant._id.toString(), dishId: dish._id.toString(), quantity: 1 });

    const response = await request(app)
      .get(`/api/orders/restaurant/${restaurant._id}`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`);

    expect(response.body.data).toHaveLength(0);
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
    expect(response.body.pagination).toBeDefined();
  });

  test('con status=current restituisce solo gli ordini non ancora consegnati', async () => {
    const customer = await createUser();
    await createOrder({ customerId: customer._id, status: 'ordered' });
    await createOrder({ customerId: customer._id, status: 'delivered' });

    const response = await request(app)
      .get('/api/orders/user?status=current')
      .set('Authorization', `Bearer ${tokenFor(customer)}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].status).toBe('ordered');
  });

  test('con status=past restituisce solo gli ordini consegnati', async () => {
    const customer = await createUser();
    await createOrder({ customerId: customer._id, status: 'ordered' });
    await createOrder({ customerId: customer._id, status: 'delivered' });

    const response = await request(app)
      .get('/api/orders/user?status=past')
      .set('Authorization', `Bearer ${tokenFor(customer)}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].status).toBe('delivered');
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
    438 |     expect(response.body.detail).toBe('Order not found');
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

const dbHandler = require('../../helpers/dbHandler');
const Order = require('../../../models/Order');
const { createUser, createRestaurant, createDish } = require('../../helpers/factories');

/* test di integrazione per il modello Order: verifica i sotto-documenti
   orderItems e delivery, l'enum status con default 'ordered', l'enum mode,
   l'unicità di orderCode e i vincoli min su quantity e unitPrice. */

beforeAll(dbHandler.connect);
afterEach(dbHandler.clearDatabase);
afterAll(dbHandler.closeDatabase);

// crea i riferimenti minimi (customer, restaurant, dish) condivisi dai test
async function createRefs() {
  const customer = await createUser();
  const restaurant = await createRestaurant();
  const dish = await createDish();
  return { customer, restaurant, dish };
}

describe('Order model', () => {
  test('crea un ordine pickup valido e applica status "ordered" come default', async () => {
    const { customer, restaurant, dish } = await createRefs();

    const order = await Order.create({
      customerId: customer._id,
      restaurantId: restaurant._id,
      orderItems: [{ dishId: dish._id, quantity: 2, unitPrice: 5 }],
      mode: 'pickup',
      totalAmount: 10,
      orderCode: 'FF-ABC123'
    });

    expect(order._id).toBeDefined();
    expect(order.status).toBe('ordered');
    expect(order.orderItems).toHaveLength(1);
  });

  test('crea un ordine delivery valido con sotto-documento delivery', async () => {
    const { customer, restaurant, dish } = await createRefs();

    const order = await Order.create({
      customerId: customer._id,
      restaurantId: restaurant._id,
      orderItems: [{ dishId: dish._id, quantity: 1, unitPrice: 8 }],
      mode: 'delivery',
      totalAmount: 8,
      orderCode: 'FF-DEL001',
      delivery: { address: 'Via Milano 5', distanceKm: 3, deliveryFee: 2 }
    });

    expect(order.delivery.address).toBe('Via Milano 5');
    expect(order.delivery.distanceKm).toBe(3);
  });

  test('rifiuta un mode non presente nell\'enum', async () => {
    const { customer, restaurant, dish } = await createRefs();

    await expect(Order.create({
      customerId: customer._id,
      restaurantId: restaurant._id,
      orderItems: [{ dishId: dish._id, quantity: 1, unitPrice: 8 }],
      mode: 'teleport',
      totalAmount: 8,
      orderCode: 'FF-BAD001'
    })).rejects.toThrow();
  });

  test('rifiuta uno status non presente nell\'enum', async () => {
    const { customer, restaurant, dish } = await createRefs();

    await expect(Order.create({
      customerId: customer._id,
      restaurantId: restaurant._id,
      orderItems: [{ dishId: dish._id, quantity: 1, unitPrice: 8 }],
      status: 'cancelled',
      mode: 'pickup',
      totalAmount: 8,
      orderCode: 'FF-BAD002'
    })).rejects.toThrow();
  });

  test('rifiuta un orderItem con quantity minore di 1', async () => {
    const { customer, restaurant, dish } = await createRefs();

    await expect(Order.create({
      customerId: customer._id,
      restaurantId: restaurant._id,
      orderItems: [{ dishId: dish._id, quantity: 0, unitPrice: 8 }],
      mode: 'pickup',
      totalAmount: 8,
      orderCode: 'FF-BAD003'
    })).rejects.toThrow();
  });

  test('rifiuta un orderItem con unitPrice negativo', async () => {
    const { customer, restaurant, dish } = await createRefs();

    await expect(Order.create({
      customerId: customer._id,
      restaurantId: restaurant._id,
      orderItems: [{ dishId: dish._id, quantity: 1, unitPrice: -5 }],
      mode: 'pickup',
      totalAmount: 8,
      orderCode: 'FF-BAD004'
    })).rejects.toThrow();
  });

  test('rifiuta due ordini con lo stesso orderCode (unique)', async () => {
    const { customer, restaurant, dish } = await createRefs();
    // assicura che l'indice unique sia stato costruito prima del test
    await Order.init();

    await Order.create({
      customerId: customer._id,
      restaurantId: restaurant._id,
      orderItems: [{ dishId: dish._id, quantity: 1, unitPrice: 8 }],
      mode: 'pickup',
      totalAmount: 8,
      orderCode: 'FF-DUPLICATE'
    });

    await expect(Order.create({
      customerId: customer._id,
      restaurantId: restaurant._id,
      orderItems: [{ dishId: dish._id, quantity: 1, unitPrice: 8 }],
      mode: 'pickup',
      totalAmount: 8,
      orderCode: 'FF-DUPLICATE'
    })).rejects.toThrow();
  });
});

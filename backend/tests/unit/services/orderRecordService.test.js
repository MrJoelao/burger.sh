jest.mock('@models/Order');
jest.mock('@models/Dish');

const Order = require('@models/Order');
const Dish = require('@models/Dish');
const {
  belongsToRestaurantMenu,
  resolveOrderItems,
  createOrderWithUniqueCode,
  populateOrderDetails
} = require('@services/orderRecordService');

const customerId = '507f1f77bcf86cd799439011';
const restaurantId = '507f1f77bcf86cd799439022';
const dishId = '507f1f77bcf86cd799439033';

// simula l'errore mongo di chiave duplicata sollevato da Order.create in caso di collisione
function duplicateOrderCodeError() {
  const error = new Error('E11000 duplicate key error');
  error.code = 11000;
  error.keyPattern = { orderCode: 1 };
  return error;
}

describe('orderRecordService', () => {
  describe('belongsToRestaurantMenu', () => {
    test('un piatto del menu comune è ordinabile in qualsiasi filiale', () => {
      const dish = { isCustom: false, restaurantId: 'altra-filiale' };
      expect(belongsToRestaurantMenu(dish, restaurantId)).toBe(true);
    });

    test('un piatto custom è ordinabile solo nella propria filiale', () => {
      const dish = { isCustom: true, restaurantId };
      expect(belongsToRestaurantMenu(dish, restaurantId)).toBe(true);
    });

    test('un piatto custom di un\'altra filiale non è ordinabile', () => {
      const dish = { isCustom: true, restaurantId: 'altra-filiale' };
      expect(belongsToRestaurantMenu(dish, restaurantId)).toBe(false);
    });
  });

  describe('resolveOrderItems', () => {
    beforeEach(() => {
      Dish.find.mockReset();
    });

    test('calcola unitPrice e totalAmount dal prezzo reale del piatto', async () => {
      Dish.find.mockResolvedValue([{ _id: dishId, price: 8.5, isCustom: false, restaurantId: null }]);

      const result = await resolveOrderItems([{ dishId, quantity: 2 }], restaurantId);

      expect(result.error).toBeUndefined();
      expect(result.orderItems).toEqual([{ dishId, quantity: 2, unitPrice: 8.5 }]);
      expect(result.totalAmount).toBe(17);
    });

    test('ignora un eventuale unitPrice inviato dal chiamante, usando sempre quello reale del piatto', async () => {
      Dish.find.mockResolvedValue([{ _id: dishId, price: 8.5, isCustom: false, restaurantId: null }]);

      const result = await resolveOrderItems([{ dishId, quantity: 1, unitPrice: 0.01 }], restaurantId);

      expect(result.orderItems[0].unitPrice).toBe(8.5);
    });

    test('ritorna un errore se il piatto non esiste', async () => {
      Dish.find.mockResolvedValue([]);

      const result = await resolveOrderItems([{ dishId, quantity: 1 }], restaurantId);

      expect(result.error).toContain('not found');
    });

    test('ritorna un errore se un piatto custom appartiene a un\'altra filiale', async () => {
      Dish.find.mockResolvedValue([{ _id: dishId, price: 5, isCustom: true, restaurantId: 'altra-filiale' }]);

      const result = await resolveOrderItems([{ dishId, quantity: 1 }], restaurantId);

      expect(result.error).toContain('not part of this restaurant\'s menu');
    });
  });

  describe('createOrderWithUniqueCode', () => {
    beforeEach(() => {
      Order.create.mockReset();
    });

    test('crea l\'ordine al primo tentativo se il codice generato è già univoco', async () => {
      const createdOrder = { _id: 'order-1' };
      Order.create.mockResolvedValue(createdOrder);

      const order = await createOrderWithUniqueCode({ customerId });

      expect(order).toBe(createdOrder);
      expect(Order.create).toHaveBeenCalledTimes(1);
    });

    test('ritenta con un nuovo codice in caso di collisione su orderCode', async () => {
      const createdOrder = { _id: 'order-2' };
      Order.create
        .mockRejectedValueOnce(duplicateOrderCodeError())
        .mockResolvedValueOnce(createdOrder);

      const order = await createOrderWithUniqueCode({ customerId });

      expect(order).toBe(createdOrder);
      expect(Order.create).toHaveBeenCalledTimes(2);
      // ogni tentativo deve generare un codice diverso, non ripetere lo stesso
      const firstCode = Order.create.mock.calls[0][0].orderCode;
      const secondCode = Order.create.mock.calls[1][0].orderCode;
      expect(firstCode).not.toBe(secondCode);
    });

    test('rilancia l\'errore originale se la collisione persiste oltre i tentativi massimi', async () => {
      Order.create.mockRejectedValue(duplicateOrderCodeError());

      await expect(createOrderWithUniqueCode({ customerId })).rejects.toThrow('E11000 duplicate key error');
      expect(Order.create).toHaveBeenCalledTimes(5);
    });

    test('rilancia subito un errore non legato a una collisione di orderCode, senza ritentare', async () => {
      const validationError = new Error('validation failed');
      Order.create.mockRejectedValue(validationError);

      await expect(createOrderWithUniqueCode({ customerId })).rejects.toThrow('validation failed');
      expect(Order.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('populateOrderDetails', () => {
    test('popola customerId, restaurantId e orderItems.dishId in un\'unica chiamata', async () => {
      const order = { populate: jest.fn().mockResolvedValue('populated-order') };

      const result = await populateOrderDetails(order);

      expect(order.populate).toHaveBeenCalledWith([
        { path: 'customerId', select: 'name surname email' },
        { path: 'restaurantId', select: 'name city managerId' },
        { path: 'orderItems.dishId', select: 'name price type' }
      ]);
      expect(result).toBe('populated-order');
    });
  });
});

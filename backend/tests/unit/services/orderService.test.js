jest.mock('@models/Order');

const Order = require('@models/Order');
const {
  isValidStatusTransition,
  checkOrderAccess,
  checkRestaurantOrdersAccess,
  createOrderWithUniqueCode
} = require('@services/orderService');

const customerId = '507f1f77bcf86cd799439011';
const managerId = '507f1f77bcf86cd799439022';
const otherUserId = '507f1f77bcf86cd799439099';

// simula l'errore mongo di chiave duplicata sollevato da Order.create in caso di collisione
function duplicateOrderCodeError() {
  const error = new Error('E11000 duplicate key error');
  error.code = 11000;
  error.keyPattern = { orderCode: 1 };
  return error;
}

describe('orderService', () => {
  describe('isValidStatusTransition', () => {
    test.each([
      ['pickup', 'ordered', 'preparing'],
      ['pickup', 'preparing', 'ready'],
      ['pickup', 'ready', 'delivered'],
      ['delivery', 'ordered', 'preparing'],
      ['delivery', 'preparing', 'on_delivery'],
      ['delivery', 'on_delivery', 'delivered']
    ])('per modalità %s permette la transizione da %s a %s', (mode, from, to) => {
      expect(isValidStatusTransition(mode, from, to)).toBe(true);
    });

    test('rifiuta un salto di stato che non passa per gli stati intermedi', () => {
      expect(isValidStatusTransition('pickup', 'ordered', 'delivered')).toBe(false);
    });

    test('rifiuta un ritorno a uno stato precedente', () => {
      expect(isValidStatusTransition('pickup', 'ready', 'preparing')).toBe(false);
    });

    test('rifiuta uno stato non ammesso per la modalità (es. "ready" in delivery)', () => {
      expect(isValidStatusTransition('delivery', 'preparing', 'ready')).toBe(false);
    });

    test('rifiuta una modalità sconosciuta', () => {
      expect(isValidStatusTransition('unknown', 'ordered', 'preparing')).toBe(false);
    });
  });

  describe('checkOrderAccess', () => {
    function buildOrder() {
      return {
        customerId: { _id: customerId },
        restaurantId: { managerId }
      };
    }

    test('view: autorizza il cliente proprietario', () => {
      const result = checkOrderAccess({ id: customerId, role: 'customer' }, buildOrder(), 'view');
      expect(result.authorized).toBe(true);
    });

    test('view: autorizza il manager della filiale', () => {
      const result = checkOrderAccess({ id: managerId, role: 'manager' }, buildOrder(), 'view');
      expect(result.authorized).toBe(true);
    });

    test('view: autorizza l\'admin', () => {
      const result = checkOrderAccess({ id: otherUserId, role: 'admin' }, buildOrder(), 'view');
      expect(result.authorized).toBe(true);
    });

    test('view: nega l\'accesso con 404 a un utente estraneo (per non rivelare l\'esistenza dell\'ordine)', () => {
      const result = checkOrderAccess({ id: otherUserId, role: 'customer' }, buildOrder(), 'view');
      expect(result).toEqual({ authorized: false, statusCode: 404, message: 'Order not found' });
    });

    test('manage: autorizza solo il manager della filiale o l\'admin', () => {
      expect(checkOrderAccess({ id: managerId, role: 'manager' }, buildOrder(), 'manage').authorized).toBe(true);
      expect(checkOrderAccess({ id: otherUserId, role: 'manager' }, buildOrder(), 'manage').authorized).toBe(false);
    });

    test('confirm_delivery: autorizza solo il cliente proprietario', () => {
      const order = { customerId };
      expect(checkOrderAccess({ id: customerId, role: 'customer' }, order, 'confirm_delivery').authorized).toBe(true);
      expect(checkOrderAccess({ id: otherUserId, role: 'customer' }, order, 'confirm_delivery').authorized).toBe(false);
    });

    test('rifiuta con 400 un accessType sconosciuto', () => {
      const result = checkOrderAccess({ id: customerId, role: 'customer' }, buildOrder(), 'delete');
      expect(result).toEqual({ authorized: false, statusCode: 400, message: 'Invalid access type' });
    });
  });

  describe('checkRestaurantOrdersAccess', () => {
    test('autorizza il manager proprietario', () => {
      const result = checkRestaurantOrdersAccess({ id: managerId, role: 'manager' }, { managerId });
      expect(result.authorized).toBe(true);
    });

    test('autorizza l\'admin a prescindere dal proprietario', () => {
      const result = checkRestaurantOrdersAccess({ id: otherUserId, role: 'admin' }, { managerId });
      expect(result.authorized).toBe(true);
    });

    test('nega l\'accesso a un manager non proprietario', () => {
      const result = checkRestaurantOrdersAccess({ id: otherUserId, role: 'manager' }, { managerId });
      expect(result.authorized).toBe(false);
      expect(result.statusCode).toBe(403);
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
});

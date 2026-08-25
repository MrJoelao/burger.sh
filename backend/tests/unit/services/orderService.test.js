const {
  isValidStatusTransition,
  checkOrderAccess,
  checkRestaurantOrdersAccess
} = require('@services/orderService');

const customerId = '507f1f77bcf86cd799439011';
const managerId = '507f1f77bcf86cd799439022';
const otherUserId = '507f1f77bcf86cd799439099';

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
});

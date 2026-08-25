const { createOrderSchema } = require('@validations/orderValidation');

const validObjectId = '507f1f77bcf86cd799439011';

function buildOrderItem(overrides = {}) {
  return {
    dishId: validObjectId,
    quantity: 2,
    unitPrice: 5,
    ...overrides
  };
}

describe('orderValidation', () => {
  describe('createOrderSchema', () => {
    test('valida un ordine pickup senza dati di consegna', () => {
      // arrange
      const payload = {
        restaurantId: validObjectId,
        orderItems: [buildOrderItem()],
        mode: 'pickup'
      };

      // act
      const { error } = createOrderSchema.validate(payload);

      // assert
      expect(error).toBeUndefined();
    });

    test('richiede il campo delivery quando mode è delivery', () => {
      // arrange
      const payload = {
        restaurantId: validObjectId,
        orderItems: [buildOrderItem()],
        mode: 'delivery'
      };

      // act
      const { error } = createOrderSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('delivery');
    });

    test('valida un ordine delivery con i dati di consegna completi', () => {
      // arrange
      const payload = {
        restaurantId: validObjectId,
        orderItems: [buildOrderItem()],
        mode: 'delivery',
        delivery: { address: 'via Roma 1' }
      };

      // act
      const { error } = createOrderSchema.validate(payload);

      // assert
      expect(error).toBeUndefined();
    });

    test('fallisce se delivery è presente ma mode è pickup', () => {
      // arrange
      const payload = {
        restaurantId: validObjectId,
        orderItems: [buildOrderItem()],
        mode: 'pickup',
        delivery: { address: 'via Roma 1' }
      };

      // act
      const { error } = createOrderSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
    });

    test('fallisce se orderItems è vuoto', () => {
      // arrange
      const payload = {
        restaurantId: validObjectId,
        orderItems: [],
        mode: 'pickup'
      };

      // act
      const { error } = createOrderSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
    });

    test('fallisce se manca restaurantId', () => {
      // arrange
      const payload = {
        orderItems: [buildOrderItem()],
        mode: 'pickup'
      };

      // act
      const { error } = createOrderSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('restaurantId');
    });

    test('rifiuta customerId e orderCode come campi sconosciuti (calcolati lato server, non nel payload)', () => {
      // arrange: la route reale li scarta comunque grazie a stripUnknown,
      // ma lo schema non li accetta più come campi validi
      const payload = {
        customerId: validObjectId,
        restaurantId: validObjectId,
        orderItems: [buildOrderItem()],
        mode: 'pickup',
        orderCode: 'FF-ABC123'
      };

      // act
      const { error } = createOrderSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
      expect(error.details.every(detail => ['customerId', 'orderCode'].includes(detail.path[0]))).toBe(true);
    });

    test('rifiuta totalAmount e status come campi sconosciuti (ricalcolati sempre lato server)', () => {
      // arrange
      const payload = {
        restaurantId: validObjectId,
        orderItems: [buildOrderItem()],
        mode: 'pickup',
        status: 'ordered',
        totalAmount: 10
      };

      // act
      const { error } = createOrderSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
      expect(error.details.every(detail => ['status', 'totalAmount'].includes(detail.path[0]))).toBe(true);
    });
  });

});

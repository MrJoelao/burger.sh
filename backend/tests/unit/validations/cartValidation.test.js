const { addCartItemSchema, updateCartItemSchema, confirmCartSchema } = require('@validations/cartValidation');

const validObjectId = '507f1f77bcf86cd799439011';

describe('cartValidation', () => {
  describe('addCartItemSchema', () => {
    test('valida un payload con restaurantId, dishId e quantity', () => {
      const payload = { restaurantId: validObjectId, dishId: validObjectId, quantity: 2 };

      const { error } = addCartItemSchema.validate(payload);

      expect(error).toBeUndefined();
    });

    test('fallisce se manca restaurantId', () => {
      const payload = { dishId: validObjectId, quantity: 2 };

      const { error } = addCartItemSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('restaurantId');
    });

    test('fallisce se quantity non è positiva', () => {
      const payload = { restaurantId: validObjectId, dishId: validObjectId, quantity: 0 };

      const { error } = addCartItemSchema.validate(payload);

      expect(error).toBeDefined();
    });

    test('rifiuta un unitPrice come campo sconosciuto (il prezzo è sempre quello reale del piatto)', () => {
      const payload = { restaurantId: validObjectId, dishId: validObjectId, quantity: 2, unitPrice: 0.01 };

      const { error } = addCartItemSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('unitPrice');
    });
  });

  describe('updateCartItemSchema', () => {
    test('valida un payload con solo quantity', () => {
      const { error } = updateCartItemSchema.validate({ quantity: 3 });

      expect(error).toBeUndefined();
    });

    test('fallisce se manca quantity', () => {
      const { error } = updateCartItemSchema.validate({});

      expect(error).toBeDefined();
    });

    test('fallisce se quantity non è positiva', () => {
      const { error } = updateCartItemSchema.validate({ quantity: -1 });

      expect(error).toBeDefined();
    });
  });

  describe('confirmCartSchema', () => {
    test('valida la conferma pickup senza dati di consegna', () => {
      const { error } = confirmCartSchema.validate({ mode: 'pickup' });

      expect(error).toBeUndefined();
    });

    test('richiede delivery quando mode è delivery', () => {
      const { error } = confirmCartSchema.validate({ mode: 'delivery' });

      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('delivery');
    });

    test('valida la conferma delivery con l\'indirizzo', () => {
      const payload = { mode: 'delivery', delivery: { address: 'via Roma 1' } };

      const { error } = confirmCartSchema.validate(payload);

      expect(error).toBeUndefined();
    });

    test('fallisce se delivery è presente ma mode è pickup', () => {
      const payload = { mode: 'pickup', delivery: { address: 'via Roma 1' } };

      const { error } = confirmCartSchema.validate(payload);

      expect(error).toBeDefined();
    });

    test('fallisce se manca mode', () => {
      const { error } = confirmCartSchema.validate({});

      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('mode');
    });
  });
});

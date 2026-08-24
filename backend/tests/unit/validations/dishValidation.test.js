const { createDishSchema, updateDishSchema } = require('@validations/dishValidation');

const validObjectId = '507f1f77bcf86cd799439011';

describe('dishValidation', () => {
  describe('createDishSchema', () => {
    test('valida un piatto standard senza restaurantId', () => {
      // arrange
      const payload = { name: 'Cheeseburger', type: 'burger', price: 8.5 };

      // act
      const { error } = createDishSchema.validate(payload);

      // assert
      expect(error).toBeUndefined();
    });

    test('fallisce se manca il nome', () => {
      // arrange
      const payload = { type: 'burger', price: 8.5 };

      // act
      const { error } = createDishSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('name');
    });

    test('fallisce se il prezzo non è un numero', () => {
      // arrange
      const payload = { name: 'Cheeseburger', type: 'burger', price: 'gratis' };

      // act
      const { error } = createDishSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
    });

    test('fallisce se il prezzo non è positivo', () => {
      // arrange
      const payload = { name: 'Cheeseburger', type: 'burger', price: -5 };

      // act
      const { error } = createDishSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
    });

    test('richiede restaurantId quando isCustom è true', () => {
      // arrange
      const payload = { name: 'Piatto custom', type: 'special', price: 10, isCustom: true };

      // act
      const { error } = createDishSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('restaurantId');
    });

    test('valida un piatto custom con restaurantId presente', () => {
      // arrange
      const payload = {
        name: 'Piatto custom',
        type: 'special',
        price: 10,
        isCustom: true,
        restaurantId: validObjectId
      };

      // act
      const { error } = createDishSchema.validate(payload);

      // assert
      expect(error).toBeUndefined();
    });

    test('non richiede restaurantId quando isCustom è false', () => {
      // arrange
      const payload = { name: 'Piatto normale', type: 'burger', price: 6, isCustom: false };

      // act
      const { error } = createDishSchema.validate(payload);

      // assert
      expect(error).toBeUndefined();
    });

    test('fallisce se ingredientIds contiene un id non esadecimale', () => {
      // arrange
      const payload = {
        name: 'Cheeseburger',
        type: 'burger',
        price: 8.5,
        ingredientIds: ['non-esadecimale']
      };

      // act
      const { error } = createDishSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
    });
  });

  describe('updateDishSchema', () => {
    test('valida un payload vuoto poiché tutti i campi sono opzionali', () => {
      // act
      const { error } = updateDishSchema.validate({});

      // assert
      expect(error).toBeUndefined();
    });

    test('valida un aggiornamento parziale corretto', () => {
      // arrange
      const payload = { price: 12 };

      // act
      const { error } = updateDishSchema.validate(payload);

      // assert
      expect(error).toBeUndefined();
    });

    test('fallisce se il prezzo non è positivo', () => {
      // arrange
      const payload = { price: 0 };

      // act
      const { error } = updateDishSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
    });

    test('fallisce se restaurantId non è un esadecimale di 24 caratteri', () => {
      // arrange
      const payload = { restaurantId: '123' };

      // act
      const { error } = updateDishSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
    });
  });
});

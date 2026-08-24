const { createRestaurantSchema, updateRestaurantSchema } = require('@validations/restaurantValidation');

const validObjectId = '507f1f77bcf86cd799439011';

describe('restaurantValidation', () => {
  describe('createRestaurantSchema', () => {
    test('valida un ristorante con tutti i campi corretti', () => {
      // arrange
      const payload = {
        name: 'Burger House',
        address: 'via Roma 10',
        city: 'Milano',
        phone: '+39 02 1234567',
        vatNumber: 'IT12345678901',
        managerId: validObjectId
      };

      // act
      const { error } = createRestaurantSchema.validate(payload);

      // assert
      expect(error).toBeUndefined();
    });

    test('fallisce se manca managerId', () => {
      // arrange
      const payload = {
        name: 'Burger House',
        address: 'via Roma 10',
        city: 'Milano',
        phone: '+39 02 1234567',
        vatNumber: 'IT12345678901'
      };

      // act
      const { error } = createRestaurantSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('managerId');
    });

    test('fallisce se il telefono contiene caratteri non ammessi', () => {
      // arrange
      const payload = {
        name: 'Burger House',
        address: 'via Roma 10',
        city: 'Milano',
        phone: 'chiamami',
        vatNumber: 'IT12345678901',
        managerId: validObjectId
      };

      // act
      const { error } = createRestaurantSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
    });

    test('fallisce se l\'indirizzo è troppo corto', () => {
      // arrange
      const payload = {
        name: 'Burger House',
        address: 'via',
        city: 'Milano',
        phone: '+39 02 1234567',
        vatNumber: 'IT12345678901',
        managerId: validObjectId
      };

      // act
      const { error } = createRestaurantSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
    });

    test('fallisce se managerId non è un esadecimale di 24 caratteri', () => {
      // arrange
      const payload = {
        name: 'Burger House',
        address: 'via Roma 10',
        city: 'Milano',
        phone: '+39 02 1234567',
        vatNumber: 'IT12345678901',
        managerId: 'id-non-valido'
      };

      // act
      const { error } = createRestaurantSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
    });
  });

  describe('updateRestaurantSchema', () => {
    test('valida un payload vuoto poiché tutti i campi sono opzionali', () => {
      // act
      const { error } = updateRestaurantSchema.validate({});

      // assert
      expect(error).toBeUndefined();
    });

    test('valida un aggiornamento parziale corretto', () => {
      // arrange
      const payload = { city: 'Torino' };

      // act
      const { error } = updateRestaurantSchema.validate(payload);

      // assert
      expect(error).toBeUndefined();
    });

    test('fallisce se il telefono aggiornato non rispetta il formato', () => {
      // arrange
      const payload = { phone: 'non-un-numero' };

      // act
      const { error } = updateRestaurantSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
    });
  });
});

const { registerSchema, updateProfileSchema } = require('@validations/userValidation');

describe('userValidation', () => {
  describe('registerSchema', () => {
    test('valida un payload di registrazione completo', () => {
      // arrange
      const payload = {
        name: 'Luigi',
        surname: 'Verdi',
        email: 'luigi.verdi@example.com',
        password: 'password123',
        role: 'manager',
        address: { street: 'via Roma', city: 'Milano', zip: '20100' },
        preferences: ['vegano']
      };

      // act
      const { error } = registerSchema.validate(payload);

      // assert
      expect(error).toBeUndefined();
    });

    test('fallisce se il ruolo è admin, non assegnabile in autoregistrazione', () => {
      // arrange
      const payload = {
        name: 'Luigi',
        surname: 'Verdi',
        email: 'luigi.verdi@example.com',
        password: 'password123',
        role: 'admin'
      };

      // act
      const { error } = registerSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
    });

    test('valida un payload minimo senza address e preferences', () => {
      // arrange
      const payload = {
        name: 'Luigi',
        surname: 'Verdi',
        email: 'luigi.verdi@example.com',
        password: 'password123',
        role: 'customer'
      };

      // act
      const { error } = registerSchema.validate(payload);

      // assert
      expect(error).toBeUndefined();
    });

    test('fallisce se il ruolo non è tra quelli ammessi', () => {
      // arrange
      const payload = {
        name: 'Luigi',
        surname: 'Verdi',
        email: 'luigi.verdi@example.com',
        password: 'password123',
        role: 'guest'
      };

      // act
      const { error } = registerSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
    });

    test('fallisce se manca il nome', () => {
      // arrange
      const payload = {
        surname: 'Verdi',
        email: 'luigi.verdi@example.com',
        password: 'password123',
        role: 'customer'
      };

      // act
      const { error } = registerSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('name');
    });

    test('fallisce se preferences non è un array di stringhe', () => {
      // arrange
      const payload = {
        name: 'Luigi',
        surname: 'Verdi',
        email: 'luigi.verdi@example.com',
        password: 'password123',
        role: 'customer',
        preferences: [123]
      };

      // act
      const { error } = registerSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
    });

    test('fallisce se preferences contiene un valore fuori dall\'elenco ammesso', () => {
      // arrange
      const payload = {
        name: 'Luigi',
        surname: 'Verdi',
        email: 'luigi.verdi@example.com',
        password: 'password123',
        role: 'customer',
        preferences: ['bitcoin_gratis']
      };

      // act
      const { error } = registerSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
    });
  });

  describe('updateProfileSchema', () => {
    test('valida un payload vuoto poiché tutti i campi sono opzionali', () => {
      // act
      const { error } = updateProfileSchema.validate({});

      // assert
      expect(error).toBeUndefined();
    });

    test('valida un aggiornamento parziale con solo email', () => {
      // arrange
      const payload = { email: 'nuova.email@example.com' };

      // act
      const { error } = updateProfileSchema.validate(payload);

      // assert
      expect(error).toBeUndefined();
    });

    test('fallisce se l\'email non è in un formato valido', () => {
      // arrange
      const payload = { email: 'non-valida' };

      // act
      const { error } = updateProfileSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
    });

    test('fallisce se la password aggiornata è troppo corta', () => {
      // arrange
      const payload = { password: '123' };

      // act
      const { error } = updateProfileSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
    });
  });
});

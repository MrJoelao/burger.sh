const { registerSchema, loginSchema } = require('@validations/authValidation');

describe('authValidation', () => {
  describe('registerSchema', () => {
    test('valida un payload di registrazione corretto', () => {
      // arrange
      const payload = {
        name: 'Mario',
        surname: 'Rossi',
        email: 'mario.rossi@example.com',
        password: 'password123',
        role: 'customer'
      };

      // act
      const { error } = registerSchema.validate(payload);

      // assert
      expect(error).toBeUndefined();
    });

    test('fallisce se manca l\'email', () => {
      // arrange
      const payload = {
        name: 'Mario',
        surname: 'Rossi',
        password: 'password123',
        role: 'customer'
      };

      // act
      const { error } = registerSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('email');
    });

    test('fallisce se l\'email non è in un formato valido', () => {
      // arrange
      const payload = {
        name: 'Mario',
        surname: 'Rossi',
        email: 'non-una-email',
        password: 'password123',
        role: 'customer'
      };

      // act
      const { error } = registerSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
    });

    test('fallisce se la password è troppo corta', () => {
      // arrange
      const payload = {
        name: 'Mario',
        surname: 'Rossi',
        email: 'mario.rossi@example.com',
        password: '123',
        role: 'customer'
      };

      // act
      const { error } = registerSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
    });

    test('accetta una password di 6 caratteri per un customer', () => {
      // arrange
      const payload = {
        name: 'Mario',
        surname: 'Rossi',
        email: 'mario.rossi@example.com',
        password: '123456',
        role: 'customer'
      };

      // act
      const { error } = registerSchema.validate(payload);

      // assert
      expect(error).toBeUndefined();
    });

    test('fallisce se un manager si registra con una password di 6 caratteri', () => {
      // arrange: un manager gestisce incassi e ordini di una filiale reale,
      // richiede una password più lunga del minimo usato per i customer
      const payload = {
        name: 'Mario',
        surname: 'Rossi',
        email: 'mario.rossi@example.com',
        password: '123456',
        role: 'manager'
      };

      // act
      const { error } = registerSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('password');
    });

    test('accetta una password di 8 caratteri per un manager', () => {
      // arrange
      const payload = {
        name: 'Mario',
        surname: 'Rossi',
        email: 'mario.rossi@example.com',
        password: '12345678',
        role: 'manager'
      };

      // act
      const { error } = registerSchema.validate(payload);

      // assert
      expect(error).toBeUndefined();
    });

    test('fallisce se il ruolo non è tra quelli ammessi', () => {
      // arrange
      const payload = {
        name: 'Mario',
        surname: 'Rossi',
        email: 'mario.rossi@example.com',
        password: 'password123',
        role: 'admin'
      };

      // act
      const { error } = registerSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
    });
  });

  describe('loginSchema', () => {
    test('valida un payload di login corretto', () => {
      // arrange
      const payload = { email: 'mario.rossi@example.com', password: 'password123' };

      // act
      const { error } = loginSchema.validate(payload);

      // assert
      expect(error).toBeUndefined();
    });

    test('fallisce se manca la password', () => {
      // arrange
      const payload = { email: 'mario.rossi@example.com' };

      // act
      const { error } = loginSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('password');
    });

    test('fallisce se l\'email non è valida', () => {
      // arrange
      const payload = { email: 'non-valida', password: 'password123' };

      // act
      const { error } = loginSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
    });
  });
});

const { createPaymentMethodSchema, updatePaymentMethodSchema } = require('@validations/paymentMethodValidation');

describe('paymentMethodValidation', () => {
  describe('createPaymentMethodSchema', () => {
    test('valida un metodo di tipo card con le ultime 4 cifre', () => {
      // arrange
      const payload = { type: 'card', label: 'Carta principale', details: '4242' };

      // act
      const { error } = createPaymentMethodSchema.validate(payload);

      // assert
      expect(error).toBeUndefined();
    });

    test('valida un metodo di tipo cash senza details', () => {
      // arrange
      const payload = { type: 'cash' };

      // act
      const { error } = createPaymentMethodSchema.validate(payload);

      // assert
      expect(error).toBeUndefined();
    });

    test('fallisce se manca type', () => {
      // arrange
      const payload = { label: 'Carta principale' };

      // act
      const { error } = createPaymentMethodSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
    });

    test('fallisce se type non è tra quelli ammessi', () => {
      // arrange
      const payload = { type: 'bitcoin' };

      // act
      const { error } = createPaymentMethodSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
    });

    test('fallisce se type è card senza details', () => {
      // arrange
      const payload = { type: 'card' };

      // act
      const { error } = createPaymentMethodSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
    });

    test('fallisce se details non sono 4 cifre numeriche', () => {
      // arrange
      const payload = { type: 'card', details: '42' };

      // act
      const { error } = createPaymentMethodSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
    });

    test('fallisce se type è cash con details valorizzato', () => {
      // arrange
      const payload = { type: 'cash', details: '4242' };

      // act
      const { error } = createPaymentMethodSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
    });
  });

  describe('updatePaymentMethodSchema', () => {
    test('valida un payload vuoto poiché tutti i campi sono opzionali', () => {
      // act
      const { error } = updatePaymentMethodSchema.validate({});

      // assert
      expect(error).toBeUndefined();
    });

    test('valida un aggiornamento del solo label', () => {
      // arrange
      const payload = { label: 'Carta lavoro' };

      // act
      const { error } = updatePaymentMethodSchema.validate(payload);

      // assert
      expect(error).toBeUndefined();
    });

    test('valida isDefault true', () => {
      // arrange
      const payload = { isDefault: true };

      // act
      const { error } = updatePaymentMethodSchema.validate(payload);

      // assert
      expect(error).toBeUndefined();
    });

    test('fallisce se details non sono 4 cifre numeriche', () => {
      // arrange
      const payload = { details: 'abcd' };

      // act
      const { error } = updatePaymentMethodSchema.validate(payload);

      // assert
      expect(error).toBeDefined();
    });
  });
});

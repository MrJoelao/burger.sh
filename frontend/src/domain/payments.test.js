import {
  SAVED_PAYMENT_TYPES,
  paymentTypeLabels,
  cardFormErrors,
  cardDetailsFrom,
  cardMethodPayload,
  paymentMethodSummary
} from './payments.js';

describe('SAVED_PAYMENT_TYPES', () => {
  test('propone carta, paypal e altro ma mai contanti', () => {
    expect(SAVED_PAYMENT_TYPES.map(type => type.id)).toEqual(['card', 'paypal', 'other']);
    expect(SAVED_PAYMENT_TYPES.map(type => type.id)).not.toContain('cash');
  });
});

describe('paymentTypeLabels', () => {
  test('traduce anche i contanti legacy arrivati dal backend', () => {
    expect(paymentTypeLabels.card).toBe('carta');
    expect(paymentTypeLabels.cash).toBe('contanti');
    expect(paymentTypeLabels.paypal).toBe('paypal');
    expect(paymentTypeLabels.other).toBe('altro');
  });
});

describe('cardFormErrors', () => {
  test('una carta valida non produce errori', () => {
    expect(cardFormErrors({
      name: 'Mario',
      surname: 'Rossi',
      number: '4242 4242 4242 4242',
      expiry: '12/29',
      cvv: '123'
    })).toEqual({});
  });

  test('intestatario e cognome hanno un minimo di due caratteri', () => {
    const errors = cardFormErrors({ name: 'M', surname: 'R', number: '4242424242424242', expiry: '12/29', cvv: '123' });

    expect(errors.name).toBeTruthy();
    expect(errors.surname).toBeTruthy();
  });

  test('il numero della carta non può essere corto o mancare', () => {
    expect(cardFormErrors({ name: 'Mario', surname: 'Rossi', number: '4242', expiry: '12/29', cvv: '123' }).number).toBeTruthy();
    expect(cardFormErrors({ name: 'Mario', surname: 'Rossi', number: '', expiry: '12/29', cvv: '123' }).number).toBeTruthy();
  });

  test('la scadenza vuole il formato MM/AA e una data futura', () => {
    const expiryErrors = (expiry) => cardFormErrors({ name: 'Mario', surname: 'Rossi', number: '4242424242424242', expiry, cvv: '123' }).expiry;

    expect(expiryErrors('13/29')).toBeTruthy();
    expect(expiryErrors('12/20')).toBeTruthy();
    expect(expiryErrors('12aa')).toBeTruthy();
    expect(expiryErrors('12/29')).toBeFalsy();
  });

  test('il cvv è di 3 o 4 cifre', () => {
    const cvvErrors = (cvv) => cardFormErrors({ name: 'Mario', surname: 'Rossi', number: '4242424242424242', expiry: '12/29', cvv }).cvv;

    expect(cvvErrors('12')).toBeTruthy();
    expect(cvvErrors('12345')).toBeTruthy();
    expect(cvvErrors('1234')).toBeFalsy();
    expect(cvvErrors('abc')).toBeTruthy();
  });
});

describe('cardDetailsFrom', () => {
  test('estrae solo le ultime quattro cifre dal numero completo', () => {
    expect(cardDetailsFrom('4242 4242 4242 4242')).toBe('4242');
    expect(cardDetailsFrom('5555 4444 3333 1111')).toBe('1111');
  });

  test('un numero senza cifre produce una stringa vuota', () => {
    expect(cardDetailsFrom('abc')).toBe('');
  });
});

describe('cardMethodPayload', () => {
  test('salva tipo carta, etichetta derivata e ultime quattro cifre', () => {
    expect(cardMethodPayload({ name: 'Mario', surname: 'Rossi', number: '4242 4242 4242 4242', isDefault: true }))
      .toEqual({ type: 'card', label: 'Carta di Mario Rossi', details: '4242', isDefault: true });
  });

  test('il numero completo non viene mai inviato', () => {
    const payload = cardMethodPayload({ name: 'Mario', surname: 'Rossi', number: '4242 4242 4242 4242' });

    expect(JSON.stringify(payload)).not.toContain('4242 4242 4242 4242');
    expect(payload.details).not.toHaveLength(16);
  });
});

describe('paymentMethodSummary', () => {
  test('una carta mostra solo le ultime quattro cifre', () => {
    expect(paymentMethodSummary({ type: 'card', details: '4242' })).toBe('•••• 4242');
  });

  test('i contanti legacy non hanno cifre', () => {
    expect(paymentMethodSummary({ type: 'cash' })).toBe('contanti');
  });

  test('un metodo assente non produce testo', () => {
    expect(paymentMethodSummary(null)).toBe('');
  });
});
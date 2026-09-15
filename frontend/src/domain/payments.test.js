import {
  paymentTypeLabels,
  paymentMethodErrors,
  paymentMethodSummary,
  paymentMethodPayload,
  paymentMethodUpdatePayload
} from './payments.js';

describe('paymentTypeLabels', () => {
  test('copre i due tipi ammessi dal backend', () => {
    expect(paymentTypeLabels).toEqual({ card: 'carta', cash: 'contanti' });
  });
});

describe('paymentMethodErrors', () => {
  test('una carta richiede le ultime quattro cifre', () => {
    const errors = paymentMethodErrors({ type: 'card', label: 'Principale', details: '12' });

    expect(errors.details).toBeTruthy();
    expect(paymentMethodErrors({ type: 'card', label: 'Principale', details: '1234' })).toEqual({});
  });

  test('i contanti rifiutano le cifre della carta', () => {
    expect(paymentMethodErrors({ type: 'cash', label: 'Alla cassa', details: '1234' }).details).toBeTruthy();
    expect(paymentMethodErrors({ type: 'cash', label: 'Alla cassa' })).toEqual({});
  });

  test('l etichetta ha un minimo di due caratteri', () => {
    expect(paymentMethodErrors({ type: 'cash', label: 'a' }).label).toBeTruthy();
  });

  test('un tipo sconosciuto è un errore', () => {
    expect(paymentMethodErrors({ type: 'crypto', label: 'Wallet' }).type).toBeTruthy();
  });
});

describe('paymentMethodSummary', () => {
  test('una carta mostra solo le ultime quattro cifre', () => {
    expect(paymentMethodSummary({ type: 'card', details: '4242' })).toBe('•••• 4242');
  });

  test('i contanti non hanno cifre', () => {
    expect(paymentMethodSummary({ type: 'cash' })).toBe('contanti');
  });

  test('un metodo assente non produce testo', () => {
    expect(paymentMethodSummary(null)).toBe('');
  });
});

describe('paymentMethodPayload', () => {
  test('una carta invia tipo, etichetta, cifre e default', () => {
    expect(paymentMethodPayload({ type: 'card', label: ' Principale ', details: ' 1234 ', isDefault: true }))
      .toEqual({ type: 'card', label: 'Principale', details: '1234', isDefault: true });
  });

  test('i contanti non inviano il campo details', () => {
    expect(paymentMethodPayload({ type: 'cash', label: 'Alla cassa', details: '' }))
      .toEqual({ type: 'cash', label: 'Alla cassa', isDefault: false });
  });
});

describe('paymentMethodUpdatePayload', () => {
  test('la modifica non invia mai il tipo', () => {
    expect(paymentMethodUpdatePayload({ type: 'card', label: ' Nuova ', details: '9999', isDefault: true }))
      .toEqual({ label: 'Nuova', details: '9999', isDefault: true });
  });
});

import {
  ORDER_FILTER_TABS,
  orderReference,
  restaurantOf,
  itemUnits,
  itemsSummary,
  statusTimeline,
  canConfirmDelivery,
  modeLabel,
  cartItemsFrom,
  orderStats
} from './orders.js';

function order(overrides = {}) {
  return {
    _id: 'o1',
    orderCode: 'FF-A1B2C3',
    status: 'preparing',
    mode: 'pickup',
    totalAmount: 13,
    createdAt: '2024-01-01T10:00:00Z',
    orderItems: [{ quantity: 2, unitPrice: 6.5, dishId: { _id: 'd1', name: 'Cheeseburger' } }],
    ...overrides
  };
}

describe('ORDER_FILTER_TABS', () => {
  test('usa solo i valori ammessi da GET /orders/user più il tab senza filtro', () => {
    expect(ORDER_FILTER_TABS.map(tab => tab.id)).toEqual(['', 'current', 'past']);
  });
});

describe('orderReference', () => {
  test('preferisce il codice alfanumerico mostrato al ritiro', () => {
    expect(orderReference(order())).toBe('FF-A1B2C3');
  });

  test('ricade sull id quando il codice manca', () => {
    expect(orderReference(order({ orderCode: '' }))).toBe('o1');
  });

  test('legge _id dei documenti mongoose quando id non c e', () => {
    expect(orderReference({ _id: 'doc1' })).toBe('doc1');
  });
});

describe('restaurantOf', () => {
  test('legge nome e città dalla ref popolata', () => {
    expect(restaurantOf(order({ restaurantId: { _id: 'r1', name: 'Duomo', city: 'Milano' } })))
      .toEqual({ name: 'Duomo', city: 'Milano' });
  });

  test('resta vuoto se il backend non popola la ref', () => {
    expect(restaurantOf(order({ restaurantId: 'r1' }))).toEqual({ name: '', city: '' });
    expect(restaurantOf(order({ restaurantId: null }))).toEqual({ name: '', city: '' });
  });
});

describe('itemUnits e itemsSummary', () => {
  test('somma le quantità di tutte le righe', () => {
    expect(itemUnits(order({ orderItems: [{ quantity: 2 }, { quantity: 3 }] }))).toBe(5);
  });

  test('riassume le righe con quantità e nome piatto', () => {
    expect(itemsSummary(order())).toBe('2× Cheeseburger');
  });

  test('un ordine senza righe non rompe il riassunto', () => {
    expect(itemsSummary(order({ orderItems: [] }))).toBe('nessuna riga');
  });
});

describe('statusTimeline', () => {
  test('per il ritiro segue il flusso senza on_delivery', () => {
    const timeline = statusTimeline('pickup', 'preparing');

    expect(timeline.map(step => step.status)).toEqual(['ordered', 'preparing', 'ready', 'delivered']);
  });

  test('per il domicilio segue il flusso senza ready', () => {
    const timeline = statusTimeline('delivery', 'preparing');

    expect(timeline.map(step => step.status)).toEqual(['ordered', 'preparing', 'on_delivery', 'delivered']);
  });

  test('marca done, current e todo secondo lo stato corrente', () => {
    const timeline = statusTimeline('pickup', 'ready');

    expect(timeline.map(step => step.state)).toEqual(['done', 'done', 'current', 'todo']);
  });

  test('uno stato fuori dal flusso della modalità non marca nulla come fatto', () => {
    const timeline = statusTimeline('pickup', 'draft');

    expect(timeline.every(step => step.state === 'todo')).toBe(true);
  });

  test('non propone stati che il backend non produce', () => {
    const timeline = statusTimeline('pickup', 'ordered');

    expect(timeline.map(step => step.status)).not.toContain('confirmed');
  });
});

describe('canConfirmDelivery', () => {
  test('solo un ordine a domicilio in consegna può essere confermato dal cliente', () => {
    expect(canConfirmDelivery(order({ mode: 'delivery', status: 'on_delivery' }))).toBe(true);
    expect(canConfirmDelivery(order({ mode: 'delivery', status: 'preparing' }))).toBe(false);
    expect(canConfirmDelivery(order({ mode: 'pickup', status: 'on_delivery' }))).toBe(false);
  });
});

describe('modeLabel', () => {
  test('traduce le due modalità di completamento', () => {
    expect(modeLabel('pickup')).toBe('ritiro');
    expect(modeLabel('delivery')).toBe('domicilio');
    expect(modeLabel(undefined)).toBe('n/d');
  });
});

describe('cartItemsFrom', () => {
  test('mappa le righe del carrello nella forma usata dalla UI', () => {
    const items = cartItemsFrom(order());

    expect(items).toEqual([
      { dishId: 'd1', name: 'Cheeseburger', price: 6.5, quantity: 2 }
    ]);
  });

  test('un carrello vuoto o assente resta una lista vuota', () => {
    expect(cartItemsFrom(order({ orderItems: [] }))).toEqual([]);
    expect(cartItemsFrom(null)).toEqual([]);
  });
});

describe('orderStats', () => {
  test('conta ordini, in corso, consegnati e la spesa dei consegnati', () => {
    const stats = orderStats([
      order({ status: 'delivered', totalAmount: 20 }),
      order({ status: 'delivered', totalAmount: 5 }),
      order({ status: 'preparing', totalAmount: 13 })
    ]);

    expect(stats).toEqual({ total: 3, current: 1, delivered: 2, spent: 25 });
  });

  test('nessun ordine produce statistiche a zero', () => {
    expect(orderStats([])).toEqual({ total: 0, current: 0, delivered: 0, spent: 0 });
  });
});

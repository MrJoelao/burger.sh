import { describe, test, expect } from 'vitest';
import {
  userQuery,
  isPendingManager,
  userId,
  roleComposition,
  orderComposition,
  totalOf
} from './admin.js';

describe('userQuery', () => {
  test('senza filtri non produce query', () => {
    expect(userQuery()).toEqual({});
    expect(userQuery({ role: '', managerStatus: '' })).toEqual({});
  });

  test('filtra per ruolo', () => {
    expect(userQuery({ role: 'manager' })).toEqual({ role: 'manager' });
  });

  test('managerStatus vale solo insieme a role=manager', () => {
    expect(userQuery({ role: 'manager', managerStatus: 'pending' }))
      .toEqual({ role: 'manager', managerStatus: 'pending' });
    expect(userQuery({ role: 'customer', managerStatus: 'pending' }))
      .toEqual({ role: 'customer' });
    expect(userQuery({ managerStatus: 'pending' })).toEqual({});
  });
});

describe('isPendingManager', () => {
  test('vero solo per un manager in attesa', () => {
    expect(isPendingManager({ role: 'manager', managerStatus: 'pending' })).toBe(true);
    expect(isPendingManager({ role: 'manager', managerStatus: 'approved' })).toBe(false);
    expect(isPendingManager({ role: 'customer' })).toBe(false);
    expect(isPendingManager(null)).toBe(false);
  });
});

describe('userId', () => {
  test('preferisce id, ricade su _id, altrimenti stringa vuota', () => {
    expect(userId({ id: 'a', _id: 'b' })).toBe('a');
    expect(userId({ _id: 'b' })).toBe('b');
    expect(userId(null)).toBe('');
  });
});

describe('roleComposition', () => {
  test('ordina clienti, manager, admin ed esclude i ruoli a zero', () => {
    const segments = roleComposition({ customer: 100, manager: 18, admin: 2 });

    expect(segments.map(segment => segment.key)).toEqual(['customer', 'manager', 'admin']);
    expect(segments[0]).toEqual({ key: 'customer', label: 'cliente', value: 100 });
  });

  test('tiene i soli ruoli presenti', () => {
    expect(roleComposition({ admin: 2 }).map(segment => segment.key)).toEqual(['admin']);
    expect(roleComposition()).toEqual([]);
  });
});

describe('orderComposition', () => {
  test('segue il flusso degli stati ed esclude quelli a zero', () => {
    const segments = orderComposition({ delivered: 832, ordered: 5, preparing: 3 });

    expect(segments.map(segment => segment.key)).toEqual(['ordered', 'preparing', 'delivered']);
    expect(segments[0].label).toBe('ORDINATO');
  });
});

describe('totalOf', () => {
  test('somma i valori dei segmenti', () => {
    expect(totalOf([{ value: 2 }, { value: 3 }])).toBe(5);
    expect(totalOf()).toBe(0);
  });
});

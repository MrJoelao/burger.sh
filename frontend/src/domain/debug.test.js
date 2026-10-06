import { describe, test, expect } from 'vitest';
import { decodeJwtPayload, maskToken, tokenTiming } from './debug.js';

/* costruisce un jwt minimo con header e payload in base64url */
function craftToken(payload) {
  const encode = (value) => btoa(JSON.stringify(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`;
}

describe('decodeJwtPayload', () => {
  test('legge il payload di un token ben formato', () => {
    const token = craftToken({ id: 'u1', role: 'admin', exp: 1000 });

    expect(decodeJwtPayload(token)).toEqual({ id: 'u1', role: 'admin', exp: 1000 });
  });

  test('restituisce null per token assente o malformato', () => {
    expect(decodeJwtPayload(null)).toBeNull();
    expect(decodeJwtPayload('non-un-jwt')).toBeNull();
    expect(decodeJwtPayload('a.b')).toBeNull();
    expect(decodeJwtPayload('a.@@@.c')).toBeNull();
  });
});

describe('maskToken', () => {
  test('maschera un token lungo lasciando inizio e fine', () => {
    const masked = maskToken('abcdefghijklmnopqrstuvwxyz0123456789');

    expect(masked.startsWith('abcdefgh')).toBe(true);
    expect(masked.endsWith('456789')).toBe(true);
    expect(masked).not.toContain('mnopqr');
  });

  test('token assente o corto non espone nulla', () => {
    expect(maskToken('')).toBe('∅');
    expect(maskToken(null)).toBe('∅');
    expect(maskToken('corto')).toBe('••••');
  });
});

describe('tokenTiming', () => {
  test('calcola scadenza e tempo residuo', () => {
    const timing = tokenTiming({ iat: 1000, exp: 2000 }, 1500 * 1000);

    expect(timing.expired).toBe(false);
    expect(timing.remainingSeconds).toBe(500);
    expect(timing.expiresAt).toBe(2000 * 1000);
    expect(timing.issuedAt).toBe(1000 * 1000);
  });

  test('token scaduto non scende sotto zero', () => {
    const timing = tokenTiming({ exp: 1000 }, 5000 * 1000);

    expect(timing.expired).toBe(true);
    expect(timing.remainingSeconds).toBe(0);
  });

  test('payload senza exp non ha tempi', () => {
    expect(tokenTiming({}, 0)).toBeNull();
    expect(tokenTiming(null, 0)).toBeNull();
  });
});

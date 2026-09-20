/**
 * Ispezione della sessione per la console di debug: decodifica del payload jwt,
 * mascheramento del token e calcolo della scadenza. Solo funzioni pure, così
 * restano verificabili senza montare componenti.
 */

export function decodeJwtPayload(token) {
  if (typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch (_error) {
    return null;
  }
}

export function maskToken(token) {
  if (!token) return '∅';
  if (token.length <= 18) return '••••';

  return `${token.slice(0, 8)}…${token.slice(-6)}`;
}

export function tokenTiming(payload, now = Date.now()) {
  if (!payload?.exp) return null;

  const expiresAt = payload.exp * 1000;
  const remainingSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000));

  return {
    issuedAt: payload.iat ? payload.iat * 1000 : null,
    expiresAt,
    remainingSeconds,
    expired: remainingSeconds === 0
  };
}

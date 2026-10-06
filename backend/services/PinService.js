/* burger.sh — PIN generation and validation service */
const crypto = require('crypto');

/* map IP -> { pin, expiresAt } for validation (one PIN per IP) */
const activePins = new Map();

/* generate a 6-digit numeric PIN */
function generatePin() {
  return crypto.randomInt(100000, 999999).toString();
}

/* get active PIN for an IP */
function getPinForIp(ip) {
  const pinData = activePins.get(ip);
  if (!pinData) return null;
  if (pinData.expiresAt < Date.now()) {
    activePins.delete(ip);
    return null;
  }
  return pinData;
}

/* store PIN for an IP with 5 minute TTL */
function storePinForIp(ip, pin) {
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  activePins.set(ip, { pin, expiresAt });
  // Auto cleanup after expiration
  setTimeout(() => activePins.delete(ip), 5 * 60 * 1000);
}

/* remove PIN for an IP */
function removePinForIp(ip) {
  activePins.delete(ip);
}

/* timing-safe PIN comparison */
function validatePin(providedPin, storedPin) {
  return crypto.timingSafeEqual(
    Buffer.from(providedPin.padEnd(6)),
    Buffer.from(storedPin.padEnd(6))
  );
}

/* cleanup all expired PINs */
function cleanupExpired() {
  const now = Date.now();
  for (const [ip, pinData] of activePins.entries()) {
    if (pinData.expiresAt < now) {
      activePins.delete(ip);
    }
  }
}

module.exports = {
  generatePin,
  getPinForIp,
  storePinForIp,
  removePinForIp,
  validatePin,
  cleanupExpired,
};
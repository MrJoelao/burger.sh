/* burger.sh — JWT secret manager for rotation strategy */

const crypto = require('crypto');

// Current active secret (read from environment)
let currentSecret = process.env.JWT_SECRET;

// Previous secret (for grace period during rotation)
let previousSecret = null;

// Grace period duration in milliseconds (default 24 hours)
const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000;

// Timestamp when the previous secret was set
let previousSecretSetAt = null;

/* rotate to a new secret. this sets the current secret as the previous one,
   and generates a new random secret as the current one. returns the new secret */
function rotateSecret() {
  previousSecret = currentSecret;
  previousSecretSetAt = Date.now();
  
  // Generate a new random secret (32 bytes, base64 encoded)
  const newSecret = crypto.randomBytes(32).toString('base64');
  currentSecret = newSecret;
  
  return newSecret;
}

/* validate a token using either the current or previous secret (if within grace period) */
function verifyToken(token) {
  try {
    // Try with current secret first
    const decoded = require('jsonwebtoken').verify(token, currentSecret);
    return decoded;
  } catch (error) {
    // If previous secret exists and is within grace period, try with it
    if (previousSecret && previousSecretSetAt && 
        (Date.now() - previousSecretSetAt) < GRACE_PERIOD_MS) {
      try {
        const decoded = require('jsonwebtoken').verify(token, previousSecret);
        return decoded;
      } catch (innerError) {
        // If both fail, throw the original error
        throw error;
      }
    }
    
    // If no previous secret or grace period expired, throw the original error
    throw error;
  }
}

/* get the current secret */
function getCurrentSecret() {
  return currentSecret;
}

/* get the previous secret */
function getPreviousSecret() {
  return previousSecret;
}

/* check if the previous secret is still valid (within grace period) */
function isPreviousSecretValid() {
  if (!previousSecret || !previousSecretSetAt) {
    return false;
  }
  return (Date.now() - previousSecretSetAt) < GRACE_PERIOD_MS;
}

module.exports = {
  rotateSecret,
  verifyToken,
  getCurrentSecret,
  getPreviousSecret,
  isPreviousSecretValid
};
/* burger.sh — Token invalidator for session invalidation on role change */

// In-memory store for invalidated tokens (in production, this should be Redis or similar)
const invalidatedTokens = new Set();

/* invalidate a token by adding it to the blacklist */
function invalidateToken(token) {
  invalidatedTokens.add(token);
}

/* check if a token is invalidated */
function isTokenInvalidated(token) {
  return invalidatedTokens.has(token);
}

/* clear all invalidated tokens (for testing purposes) */
function clearInvalidatedTokens() {
  invalidatedTokens.clear();
}

module.exports = {
  invalidateToken,
  isTokenInvalidated,
  clearInvalidatedTokens
};
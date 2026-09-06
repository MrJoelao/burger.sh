/* burger.sh — IP extraction service for proxy-aware requests */

/* get real client IP from request, considering reverse proxies */
function getRealIp(req) {
  // Priority: X-Forwarded-For (first IP), Forwarded, X-Real-IP, req.ip
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  const forwarded = req.headers['forwarded'];
  if (forwarded) {
    const forMatch = forwarded.match(/for="?\[?([^\]",\s]+)"?\]?/i);
    if (forMatch) return forMatch[1];
  }

  const xRealIp = req.headers['x-real-ip'];
  if (xRealIp) return xRealIp;

  // Fallback to req.ip (handled by express with trust proxy)
  return req.ip;
}

module.exports = {
  getRealIp,
};
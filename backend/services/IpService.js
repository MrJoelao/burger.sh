/* burger.sh — IP extraction service for proxy-aware requests */

/* get real client IP from request.
   IMPORTANT: do not trust forwarding headers directly in app code;
   rely on req.ip only, after express "trust proxy" configuration. */
function getRealIp(req) {
  return req.ip;
}

module.exports = {
  getRealIp,
};
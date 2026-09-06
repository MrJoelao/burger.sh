/* burger.sh — Audit logger for setup events */

const { getRealIp } = require('../IpService');

/* log an audit event with timestamp, IP, user agent, and event type */
function logAuditEvent(eventType, req, details = {}) {
  const ip = getRealIp(req) || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  const timestamp = new Date().toISOString();
  
  console.log(`[AUDIT] ${timestamp} | IP: ${ip} | UA: ${userAgent} | EVENT: ${eventType}`, details);
}

/* log setup requested event */
function logSetupRequested(req) {
  logAuditEvent('setup requested', req);
}

/* log pin generated event */
function logPinGenerated(req, pin) {
  logAuditEvent('pin generated', req, { pin });
}

/* log setup executed event */
function logSetupExecuted(req, adminEmail) {
  logAuditEvent('setup executed', req, { adminEmail });
}

/* log password changed event */
function logPasswordChanged(req, userId) {
  logAuditEvent('password changed', req, { userId });
}

module.exports = {
  logSetupRequested,
  logPinGenerated,
  logSetupExecuted,
  logPasswordChanged
};
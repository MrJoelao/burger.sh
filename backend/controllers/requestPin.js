/* burger.sh — request PIN controller */
const { getRealIp } = require('../services/IpService.js');
const PinService = require('../services/PinService.js');

function requestPin(req, res) {
  // Same robust localhost check
  const isLocal = (() => {
    const ip = getRealIp(req) || '';
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
    if (ip.startsWith('::ffff:')) return true;
    const socketAddr = req.socket?.remoteAddress || '';
    if (socketAddr === '127.0.0.1' || socketAddr === '::1' || socketAddr.startsWith('::ffff:')) return true;
    return false;
  })();

  // DEBUG
  console.log('[PIN] real ip:', getRealIp(req), '| isLocal:', isLocal);

  if (isLocal) {
    return res.json({
      success: true,
      data: {
        pinRequired: false,
        message: 'Connessione locale rilevata. Procedi con il setup.'
      }
    });
  }

  // Generate PIN
  const pin = PinService.generatePin();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  PinService.storePinForIp(getRealIp(req), pin, expiresAt);

  // Auto cleanup after expiration
  setTimeout(() => PinService.removePinForIp(getRealIp(req)), 5 * 60 * 1000);

  // Log audit event
  const auditLogger = require('../utils/logging/auditLogger');
  auditLogger.logPinGenerated(req, pin);

  console.log(`[PIN SETUP] Il PIN per il setup e': ${pin}`);
  console.log(`[PIN SETUP] Valido fino a: ${new Date(expiresAt).toLocaleString('it-IT')}`);
  console.log(`[PIN SETUP] Richiesto da IP: ${getRealIp(req)}`);
  console.log('');

  res.json({
    success: true,
    data: {
      pinRequired: true,
      message: 'Esegui questo setup su una macchina locale per saltare la verifica PIN.'
    }
  });
}

module.exports = {
  requestPin,
};
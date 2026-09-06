/* burger.sh — execute setup controller */
const { getRealIp } = require('../services/IpService.js');
const PinService = require('../services/PinService.js');
const AdminCredentialsService = require('../services/AdminCredentialsService.js');
const SeederService = require('../services/SeederService.js');
const User = require('../models/User');

async function executeSetup(req, res) {
  try {
    // 1. Check environment guard
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_FIRST_RUN_SETUP !== 'true') {
      return res.status(403).json({
        success: false,
        message: 'Setup disabilitato in produzione. Imposta ALLOW_FIRST_RUN_SETUP=true per abilitarlo.'
      });
    }

    // 2. Check if setup already completed
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: 'Setup gia\' completato. E\' presente un account admin esistente.'
      });
    }

    // 3. Validate PIN if required
    const isLocal = isLocalRequest(req);

    if (!isLocal) {
      const body = req.body || {};
      const { pin } = body;
      if (!pin) {
        return res.status(400).json({
          success: false,
          message: 'PIN richiesto per setup remoto. Richiedi un PIN con POST /setup/request-pin.'
        });
      }

      const ip = getRealIp(req);
      const pinData = PinService.getPinForIp(ip);
      if (!pinData) {
        return res.status(401).json({
          success: false,
          message: 'PIN non valido o scaduto.'
        });
      }

      if (!PinService.validatePin(pin, pinData.pin)) {
        PinService.removePinForIp(ip);
        return res.status(401).json({
          success: false,
          message: 'PIN non valido.'
        });
      }

      PinService.removePinForIp(ip);
    }

    // 4. Generate admin credentials
    const adminEmail = AdminCredentialsService.generateAdminEmail();
    const adminPassword = AdminCredentialsService.generateRandomPassword();

    // 5. Create admin user
    const admin = await AdminCredentialsService.createAdminUser(adminEmail, adminPassword);

    console.log(`\n[SETUP] Admin creato: ${adminEmail}`);
    console.log(`[SETUP] Password provvisoria: ${adminPassword}`);
    console.log('[SETUP] IMPORTANT: Cambia subito la password al primo accesso!\n');

    // 6. Seed meals (idempotent)
    await SeederService.seedMeals();

    // Log audit event
    const auditLogger = require('../utils/logging/auditLogger');
    auditLogger.logSetupExecuted(req, adminEmail);

    // 6. Return credentials (one time only)
    res.status(201).json({
      success: true,
      message: 'Setup completato con successo.',
      data: {
        adminEmail,
        adminPassword,
        mustChangePassword: true,
        redirectUrl: '/change-password'
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/* check if request is from localhost */
function isLocalRequest(req) {
  const ip = getRealIp(req) || '';
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
  if (ip.startsWith('::ffff:')) return true;
  const socketAddr = req.socket?.remoteAddress || '';
  if (socketAddr === '127.0.0.1' || socketAddr === '::1' || socketAddr.startsWith('::ffff:')) return true;
  return false;
}

module.exports = {
  executeSetup,
};
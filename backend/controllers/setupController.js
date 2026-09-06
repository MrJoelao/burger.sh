// burger.sh — unified setup controller
const User = require('../models/User');
const { getRealIp } = require('../services/IpService.js');
const PinService = require('../services/PinService.js');
const AdminCredentialsService = require('../services/AdminCredentialsService.js');
const SeederService = require('../services/SeederService.js');
const { comparePassword, hashPassword } = require('../utils/password');
const { jsonOk, jsonError } = require('../utils/httpResponses');

/** getSetupStatus: restituisce lo stato del setup e se esiste già un admin */
async function getSetupStatus(req, res) {
  try {
    const adminExists = await User.exists({ role: 'admin' });
    const setupCompleted = await User.exists({ setupCompleted: true });
    console.log('[SETUP STATUS] adminExists:', adminExists, 'setupCompleted:', setupCompleted);
    res.json({
      success: true,
      data: {
        setupCompleted: !!setupCompleted || !!adminExists,
        adminExists: !!adminExists,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/** requestPin: genera un PIN per il setup remoto, o lo bypassa su localhost */
function requestPin(req, res) {
  const isLocal = (() => {
    const ip = getRealIp(req) || '';
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
    if (ip.startsWith('::ffff:')) return true;
    const socketAddr = req.socket?.remoteAddress || '';
    if (socketAddr === '127.0.0.1' || socketAddr === '::1' || socketAddr.startsWith('::ffff:')) return true;
    return false;
  })();

  console.log('[PIN] real ip:', getRealIp(req), '| isLocal:', isLocal);

  if (isLocal) {
    return res.json({
      success: true,
      data: { pinRequired: false, message: 'Connessione locale rilevata. Procedi con il setup.' },
    });
  }

  const pin = PinService.generatePin();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minuti
  PinService.storePinForIp(getRealIp(req), pin, expiresAt);
  setTimeout(() => PinService.removePinForIp(getRealIp(req)), 5 * 60 * 1000);

  const auditLogger = require('../utils/logging/auditLogger');
  auditLogger.logPinGenerated(req, pin);

  console.log(`[PIN SETUP] Il PIN per il setup è: ${pin}`);
  console.log(`[PIN SETUP] Valido fino a: ${new Date(expiresAt).toLocaleString('it-IT')}`);
  console.log(`[PIN SETUP] Richiesto da IP: ${getRealIp(req)}`);
  console.log('');

  res.json({
    success: true,
    data: { pinRequired: true, message: 'Esegui questo setup su una macchina locale per saltare la verifica PIN.' },
  });
}

/** executeSetup: completa il flusso di setup iniziale */
async function executeSetup(req, res) {
  try {
    // 1. Controllo ambiente
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_FIRST_RUN_SETUP !== 'true') {
      return res.status(403).json({
        success: false,
        message: 'Setup disabilitato in produzione. Imposta ALLOW_FIRST_RUN_SETUP=true per abilitarlo.',
      });
    }

    // 2. Verifica se il setup è già stato eseguito
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "Setup già completato. È presente un account admin esistente.",
      });
    }

    // 3. Verifica PIN se necessario
    const isLocal = isLocalRequest(req);
    if (!isLocal) {
      const body = req.body || {};
      const { pin } = body;
      if (!pin) {
        return res.status(400).json({
          success: false,
          message: 'PIN richiesto per setup remoto. Richiedi un PIN con POST /setup/request-pin.',
        });
      }

      const ip = getRealIp(req);
      const pinData = PinService.getPinForIp(ip);
      if (!pinData) {
        return res.status(401).json({ success: false, message: 'PIN non valido o scaduto.' });
      }

      if (!PinService.validatePin(pin, pinData.pin)) {
        PinService.removePinForIp(ip);
        return res.status(401).json({ success: false, message: 'PIN non valido.' });
      }
      PinService.removePinForIp(ip);
    }

    // 4. Generazione credenziali admin
    const adminEmail = AdminCredentialsService.generateAdminEmail();
    const adminPassword = AdminCredentialsService.generateRandomPassword();
    const admin = await AdminCredentialsService.createAdminUser(adminEmail, adminPassword);

    console.log(`\n[SETUP] Admin creato: ${adminEmail}`);
    console.log(`[SETUP] Password provvisoria: ${adminPassword}`);
    console.log('[SETUP] IMPORTANT: Cambia subito la password al primo accesso!\n');

    // 5. Seed meals (idempotente)
    await SeederService.seedMeals();

    // Log audit event
    const auditLogger = require('../utils/logging/auditLogger');
    auditLogger.logSetupExecuted(req, adminEmail);

    // 6. Restituisci credenziali (una sola volta)
    res.status(201).json({
      success: true,
      message: 'Setup completato con successo.',
      data: { adminEmail, adminPassword, mustChangePassword: true, redirectUrl: '/change-password' },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/** Helper: verifica se la richiesta proviene da localhost */
function isLocalRequest(req) {
  const ip = getRealIp(req) || '';
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
  if (ip.startsWith('::ffff:')) return true;
  const socketAddr = req.socket?.remoteAddress || '';
  if (socketAddr === '127.0.0.1' || socketAddr === '::1' || socketAddr.startsWith('::ffff:')) return true;
  return false;
}

/** changePassword: gestisce il flusso di cambio password obbligatorio */
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utente non trovato.' });
    }
    if (!user.mustChangePassword) {
      return res.status(400).json({
        success: false,
        message: 'Non sei obbligato a cambiare password. Usa la normale modifica profilo.',
      });
    }
    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Password attuale non corretta.' });
    }
    user.passwordHash = await hashPassword(newPassword);
    user.mustChangePassword = false;
    await user.save();
    const auditLogger = require('../utils/logging/auditLogger');
    auditLogger.logPasswordChanged(req, user._id);
    res.json({ success: true, message: 'Password aggiornata con successo.', data: { redirectUrl: '/index.html' } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getSetupStatus,
  requestPin,
  executeSetup,
  changePassword,
};

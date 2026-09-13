// burger.sh — unified setup controller
const User = require('../models/User');
const { getRealIp } = require('../services/IpService.js');
const PinService = require('../services/PinService.js');
const AdminCredentialsService = require('../services/AdminCredentialsService.js');
const SeederService = require('../services/SeederService.js');
const { comparePassword, hashPassword } = require('../utils/password');
const { jsonOk, jsonError } = require('../utils/httpResponses');

/** getSetupStatus: restituisce lo stato del setup e se esiste già un admin */
async function getSetupStatus(req, res, next) {
  try {
    const adminExists = await User.exists({ role: 'admin' });
    const setupCompleted = await User.exists({ setupCompleted: true });
    return jsonOk(res, 200, {
      setupCompleted: !!setupCompleted || !!adminExists,
      adminExists: !!adminExists
    });
  } catch (error) {
    next(error);
  }
}

/** requestPin: genera un PIN per il setup remoto, o lo bypassa su localhost */
function requestPin(req, res) {
  const isLocal = isLocalRequest(req);

  if (isLocal) {
    return jsonOk(res, 200, {
      pinRequired: false,
      message: 'Connessione locale rilevata. Procedi con il setup.'
    });
  }

  const ip = getRealIp(req);
  if (!ip) {
    return jsonError(res, 400, 'Impossibile determinare IP client');
  }

  const pin = PinService.generatePin();
  PinService.storePinForIp(ip, pin);

  const auditLogger = require('../utils/logging/auditLogger');
  auditLogger.logPinGenerated(req);

  return jsonOk(res, 200, {
    pinRequired: true,
    message: 'Esegui questo setup su una macchina locale per saltare la verifica PIN.'
  });
}

/** executeSetup: completa il flusso di setup iniziale */
async function executeSetup(req, res, next) {
  try {
    // 1. Controllo ambiente
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_FIRST_RUN_SETUP !== 'true') {
      return jsonError(res, 403, 'Setup disabilitato in produzione. Imposta ALLOW_FIRST_RUN_SETUP=true per abilitarlo.');
    }

    // 2. Verifica se il setup è già stato eseguito
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return jsonError(res, 409, "Setup già completato. È presente un account admin esistente.");
    }

    // 3. Verifica PIN se necessario
    const isLocal = isLocalRequest(req);
    if (!isLocal) {
      const { pin } = req.validated;
      if (!pin) {
        return jsonError(res, 400, 'PIN richiesto per setup remoto. Richiedi un PIN con POST /api/setup/request-pin.');
      }

      const ip = getRealIp(req);
      const pinData = PinService.getPinForIp(ip);
      if (!pinData) {
        return jsonError(res, 401, 'PIN non valido o scaduto.');
      }

      if (!PinService.validatePin(pin, pinData.pin)) {
        PinService.removePinForIp(ip);
        return jsonError(res, 401, 'PIN non valido.');
      }
      PinService.removePinForIp(ip);
    }

    // 4. Generazione credenziali admin
    const adminEmail = AdminCredentialsService.generateAdminEmail();
    const adminPassword = AdminCredentialsService.generateRandomPassword();
    await AdminCredentialsService.createAdminUser(adminEmail, adminPassword);

    // 5. Seed meals (idempotente)
    await SeederService.seedMeals();

    // Log audit event
    const auditLogger = require('../utils/logging/auditLogger');
    auditLogger.logSetupExecuted(req, adminEmail);

    // 6. Restituisci credenziali (una sola volta)
    return jsonOk(res, 201, {
      adminEmail,
      adminPassword,
      mustChangePassword: true,
      redirectUrl: '/change-password'
    });
  } catch (error) {
    next(error);
  }
}

/** Helper: verifica se la richiesta proviene da localhost */
function isLocalRequest(req) {
  const ip = getRealIp(req);
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
}

/** changePassword: gestisce il flusso di cambio password obbligatorio */
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.validated;
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return jsonError(res, 404, 'Utente non trovato.');
    }
    if (!user.mustChangePassword) {
      return jsonError(res, 400, 'Non sei obbligato a cambiare password. Usa la normale modifica profilo.');
    }
    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return jsonError(res, 401, 'Password attuale non corretta.');
    }
    user.passwordHash = await hashPassword(newPassword);
    user.mustChangePassword = false;
    await user.save();
    const auditLogger = require('../utils/logging/auditLogger');
    auditLogger.logPasswordChanged(req, user._id);
    return jsonOk(res, 200, { redirectUrl: '/index.html' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSetupStatus,
  requestPin,
  executeSetup,
  changePassword
};

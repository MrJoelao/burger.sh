/* burger.sh — change password controller */
const User = require('../models/User');
const { comparePassword, hashPassword } = require('../utils/password');

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
        message: 'Non sei obbligato a cambiare password. Usa la normale modifica profilo.'
      });
    }

    // Verify current password
    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Password attuale non corretta.' });
    }

    // Update password
    user.passwordHash = await hashPassword(newPassword);
    user.mustChangePassword = false;
    await user.save();

    // Log audit event
    const auditLogger = require('../utils/logging/auditLogger');
    auditLogger.logPasswordChanged(req, user._id);

    res.json({
      success: true,
      message: 'Password aggiornata con successo.',
      data: { redirectUrl: '/index.html' }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  changePassword,
};
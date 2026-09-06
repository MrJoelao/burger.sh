/* burger.sh — setup status controller */
const User = require('../models/User');

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
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getSetupStatus,
};
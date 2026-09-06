/* burger.sh — setup controller (combined exports for backward compatibility) */
const { getSetupStatus } = require('./setupStatus.js');
const { requestPin } = require('./requestPin.js');
const { executeSetup } = require('./executeSetup.js');
const { changePassword } = require('./changePassword.js');

module.exports = {
  getSetupStatus,
  requestPin,
  executeSetup,
  changePassword,
};
/* burger.sh — admin credentials generation service */
const crypto = require('crypto');
const User = require('../models/User');
const { hashPassword } = require('../utils/password');

/* genera una password provvisoria casuale: l'email invece viene scelta
   dall'utente durante il setup, quindi qui non serve generarla. */
function generateRandomPassword() {
  return crypto.randomBytes(10).toString('hex');
}

/* crea l'admin con i dati raccolti al setup; la password resta quella
   generata dal backend e va cambiata al primo accesso. */
async function createAdminUser({ email, password, name, surname, address }) {
  const passwordHash = await hashPassword(password);
  return await User.create({
    name,
    surname,
    email,
    passwordHash,
    role: 'admin',
    mustChangePassword: true,
    setupCompleted: true,
    ...(address ? { address } : {}),
  });
}

module.exports = {
  generateRandomPassword,
  createAdminUser,
};
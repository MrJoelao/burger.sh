/* burger.sh — admin credentials generation service */
const crypto = require('crypto');
const User = require('../models/User');
const { hashPassword } = require('../utils/password');

/* generate random 16-char hex password */
function generateRandomPassword() {
  return crypto.randomBytes(10).toString('hex');
}

/* generate random admin email */
function generateAdminEmail() {
  return crypto.randomBytes(4).toString('hex') + '@burger.sh';
}

/* hash password and create admin user */
async function createAdminUser(email, password, name = 'Admin', surname = 'System') {
  const passwordHash = await hashPassword(password);
  return await User.create({
    name,
    surname,
    email,
    passwordHash,
    role: 'admin',
    mustChangePassword: true,
    setupCompleted: true,
  });
}

module.exports = {
  generateRandomPassword,
  generateAdminEmail,
  createAdminUser,
};
const jwt = require('jsonwebtoken');
const secretManager = require('../utils/secretManager');

function signUser(user) {
  const payload = {
    id: user._id.toString(),
    role: user.role,
  };

  return jwt.sign(payload, secretManager.getCurrentSecret(), {
    expiresIn: '3h',
  });
}

// Verifica il token e ritorna la payload
function verifyToken(token) {
  return secretManager.verifyToken(token);
}

module.exports = {
  signUser,
  verifyToken,
};

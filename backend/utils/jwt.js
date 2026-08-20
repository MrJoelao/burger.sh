const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

function signUser(user) {
  // salvo nella payload user id e il suo ruolo.
  const payload = {
    id: user._id.toString(),
    role: user.role,
  };

  // metto una scadenza di 3h per la sua validitàs
  return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '3h',
    });
}

// verifico il token e ritorno la payload
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  signUser,
  verifyToken,
};

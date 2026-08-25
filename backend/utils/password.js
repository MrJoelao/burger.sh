const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

async function hashPassword(plainPassword) {
  // bcrypt.hash genera internamente un sale e calcola l'hash
  const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
  return hash;
}

async function comparePassword(plainPassword, hashedPassword) {
  // ritorna true se la password in chiaro corrisponde all'hash
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  return isMatch;
}

/* prende un oggetto di aggiornamenti (es. req.validated) e, se contiene una
   password in chiaro, la sostituisce con il relativo passwordHash. usata da
   userController.updateMe e adminController.updateUser, così l'utente e
   l'admin aggiornano la password nello stesso identico modo. */
async function applyPasswordUpdate(updates) {
  if (!updates.password) {
    return updates;
  }

  const { password, ...rest } = updates;
  return { ...rest, passwordHash: await hashPassword(password) };
}

module.exports = {
  hashPassword,
  comparePassword,
  applyPasswordUpdate,
};

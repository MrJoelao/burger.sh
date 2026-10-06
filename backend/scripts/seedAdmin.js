require('dotenv').config({ quiet: true });

const mongoose = require('mongoose');
const Joi = require('joi');
const connectDB = require('../config/db');
const User = require('../models/User');
const { hashPassword } = require('../utils/password');

/* crea l'unico account admin iniziale di un ambiente nuovo, a partire da
   argomenti da riga di comando:

     node scripts/seedAdmin.js --name Mario --surname Rossi \
       --email admin@example.com --password "una-password-di-almeno-12-caratteri"

   se esiste già un utente con quella email, lo script si ferma con un
   errore e non modifica nulla: non aggiorna né sovrascrive credenziali
   esistenti. la password richiede almeno 12 caratteri (più lunga del minimo
   di 6 usato per i customer in authValidation.js) perché un account admin
   ha privilegi su ogni risorsa del sistema.

   nota di sicurezza: passare la password come argomento da riga di comando
   la espone nella cronologia della shell e nell'elenco processi (`ps`) per
   la durata dell'esecuzione. va bene per un bootstrap manuale su una macchina
   di sviluppo o in una pipeline che pulisce la history subito dopo; non è
   adatto a un uso frequente o non presidiato. */

const ADMIN_ARGS_SCHEMA = Joi.object({
  name: Joi.string().min(2).required(),
  surname: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(12).required()
});

function parseArgs(argv) {
  const rawArgs = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '');
    rawArgs[key] = argv[i + 1];
  }

  const { error, value } = ADMIN_ARGS_SCHEMA.validate(rawArgs);
  if (error) {
    throw new Error(`Argomenti non validi: ${error.message}`);
  }

  return value;
}

async function createAdmin({ name, surname, email, password }) {
  const passwordHash = await hashPassword(password);

  return User.create({ name, surname, email, passwordHash, role: 'admin' });
}

async function seedAdmin(argv) {
  const admin = parseArgs(argv);

  await connectDB();
  try {
    await createAdmin(admin);
    console.log(`Admin creato: ${admin.email}`);
  } finally {
    await mongoose.disconnect();
  }
}

module.exports = { parseArgs, createAdmin, seedAdmin };

if (require.main === module) {
  seedAdmin(process.argv.slice(2)).catch((error) => {
    if (error.code === 11000) {
      console.error('Errore: esiste già un utente con questa email. Nessuna modifica effettuata.');
    } else {
      console.error('Errore durante la creazione dell\'admin:', error.message);
    }
    process.exit(1);
  });
}

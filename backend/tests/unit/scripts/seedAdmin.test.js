jest.mock('@models/User');
jest.mock('@config/db');
jest.mock('@utils/password');
jest.mock('mongoose', () => ({
  ...jest.requireActual('mongoose'),
  disconnect: jest.fn().mockResolvedValue(undefined)
}));

const User = require('@models/User');
const connectDB = require('@config/db');
const { hashPassword } = require('@utils/password');
const mongoose = require('mongoose');
const { parseArgs, createAdmin, seedAdmin } = require('../../../scripts/seedAdmin');

/* test unitari di seedAdmin: User, connectDB, hashPassword e mongoose sono
   mockati, così si verifica solo la logica dello script (parsing/validazione
   degli argomenti, creazione dell'admin, gestione della disconnessione) senza
   toccare un vero database. */
describe('seedAdmin', () => {
  const validArgv = [
    '--name', 'Mario',
    '--surname', 'Rossi',
    '--email', 'admin@example.com',
    '--password', 'PasswordSicura123'
  ];

  describe('parseArgs', () => {
    test('legge name, surname, email e password dai flag da riga di comando', () => {
      expect(parseArgs(validArgv)).toEqual({
        name: 'Mario',
        surname: 'Rossi',
        email: 'admin@example.com',
        password: 'PasswordSicura123'
      });
    });

    test('lancia un errore se l\'email non è valida', () => {
      const argv = ['--name', 'Mario', '--surname', 'Rossi', '--email', 'non-una-email', '--password', 'PasswordSicura123'];
      expect(() => parseArgs(argv)).toThrow(/email/i);
    });

    test('lancia un errore se la password è più corta di 12 caratteri', () => {
      const argv = ['--name', 'Mario', '--surname', 'Rossi', '--email', 'admin@example.com', '--password', 'corta1'];
      expect(() => parseArgs(argv)).toThrow(/password/i);
    });

    test('lancia un errore se manca un argomento obbligatorio', () => {
      const argv = ['--name', 'Mario', '--email', 'admin@example.com', '--password', 'PasswordSicura123'];
      expect(() => parseArgs(argv)).toThrow(/surname/i);
    });
  });

  describe('createAdmin', () => {
    test('crea l\'utente con ruolo admin e la password hashata, mai in chiaro', async () => {
      hashPassword.mockResolvedValue('hash-fittizio');
      User.create.mockResolvedValue({ _id: '1', email: 'admin@example.com' });

      await createAdmin({ name: 'Mario', surname: 'Rossi', email: 'admin@example.com', password: 'PasswordSicura123' });

      expect(hashPassword).toHaveBeenCalledWith('PasswordSicura123');
      expect(User.create).toHaveBeenCalledWith({
        name: 'Mario',
        surname: 'Rossi',
        email: 'admin@example.com',
        passwordHash: 'hash-fittizio',
        role: 'admin'
      });
    });
  });

  describe('seedAdmin', () => {
    test('si connette al database, crea l\'admin e si disconnette', async () => {
      hashPassword.mockResolvedValue('hash-fittizio');
      User.create.mockResolvedValue({ _id: '1' });

      await seedAdmin(validArgv);

      expect(connectDB).toHaveBeenCalled();
      expect(User.create).toHaveBeenCalled();
      expect(mongoose.disconnect).toHaveBeenCalled();
    });

    test('si disconnette anche se la creazione fallisce (es. email già in uso)', async () => {
      hashPassword.mockResolvedValue('hash-fittizio');
      const duplicateEmailError = Object.assign(new Error('duplicate'), { code: 11000 });
      User.create.mockRejectedValue(duplicateEmailError);

      await expect(seedAdmin(validArgv)).rejects.toThrow('duplicate');
      expect(mongoose.disconnect).toHaveBeenCalled();
    });

    test('non si connette al database se gli argomenti non sono validi', async () => {
      const invalidArgv = ['--name', 'Mario', '--surname', 'Rossi', '--email', 'non-valida', '--password', 'PasswordSicura123'];

      await expect(seedAdmin(invalidArgv)).rejects.toThrow();
      expect(connectDB).not.toHaveBeenCalled();
    });
  });
});

const dbHandler = require('../../helpers/dbHandler');
const User = require('../../../models/User');

/* test di integrazione per il modello User: verifica campi obbligatori,
   enum del ruolo, unicità dell'email, sotto-schema address e timestamps. */

beforeAll(dbHandler.connect);
afterEach(dbHandler.clearDatabase);
afterAll(dbHandler.closeDatabase);

describe('User model', () => {
  test('crea un utente valido con tutti i campi richiesti', async () => {
    const user = await User.create({
      name: 'Mario',
      surname: 'Rossi',
      email: 'mario@example.com',
      passwordHash: 'hashed',
      role: 'customer'
    });

    expect(user._id).toBeDefined();
    expect(user.name).toBe('Mario');
    expect(user.createdAt).toBeDefined();
    expect(user.updatedAt).toBeDefined();
  });

  test('rifiuta un utente senza name', async () => {
    await expect(User.create({
      surname: 'Rossi',
      email: 'mario2@example.com',
      passwordHash: 'hashed',
      role: 'customer'
    })).rejects.toThrow();
  });

  test('rifiuta un utente senza surname', async () => {
    await expect(User.create({
      name: 'Mario',
      email: 'mario3@example.com',
      passwordHash: 'hashed',
      role: 'customer'
    })).rejects.toThrow();
  });

  test('rifiuta un utente senza email', async () => {
    await expect(User.create({
      name: 'Mario',
      surname: 'Rossi',
      passwordHash: 'hashed',
      role: 'customer'
    })).rejects.toThrow();
  });

  test('rifiuta un utente senza passwordHash', async () => {
    await expect(User.create({
      name: 'Mario',
      surname: 'Rossi',
      email: 'mario4@example.com',
      role: 'customer'
    })).rejects.toThrow();
  });

  test('rifiuta un utente senza role', async () => {
    await expect(User.create({
      name: 'Mario',
      surname: 'Rossi',
      email: 'mario5@example.com',
      passwordHash: 'hashed'
    })).rejects.toThrow();
  });

  test('rifiuta un role non presente nell\'enum', async () => {
    await expect(User.create({
      name: 'Mario',
      surname: 'Rossi',
      email: 'mario6@example.com',
      passwordHash: 'hashed',
      role: 'superadmin'
    })).rejects.toThrow();
  });

  test('rifiuta due utenti con la stessa email (unique)', async () => {
    // assicura che l'indice unique sia stato costruito prima del test
    await User.init();

    await User.create({
      name: 'Mario',
      surname: 'Rossi',
      email: 'duplicato@example.com',
      passwordHash: 'hashed',
      role: 'customer'
    });

    await expect(User.create({
      name: 'Luigi',
      surname: 'Verdi',
      email: 'duplicato@example.com',
      passwordHash: 'hashed',
      role: 'customer'
    })).rejects.toThrow();
  });

  test('salva correttamente il sotto-schema address', async () => {
    const user = await User.create({
      name: 'Mario',
      surname: 'Rossi',
      email: 'address@example.com',
      passwordHash: 'hashed',
      role: 'customer',
      address: { street: 'Via Roma 1', city: 'Milano', zip: '20100' }
    });

    expect(user.address.street).toBe('Via Roma 1');
    expect(user.address.city).toBe('Milano');
    expect(user.address.zip).toBe('20100');
    // il sotto-schema non deve generare un proprio _id
    expect(user.address._id).toBeUndefined();
  });
});

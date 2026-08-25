/* verifica il controllo fail-fast su JWT_SECRET all'avvio dell'app, sullo
   stesso principio già applicato a MONGODB_URI in config/db.js: se manca,
   l'app non deve nemmeno arrivare ad ascoltare richieste con un secret
   undefined. dotenv viene mockato per non far leggere il vero file .env
   del progetto, che altrimenti ripopolerebbe JWT_SECRET durante il test. */

describe('app - validazione JWT_SECRET', () => {
  const originalJwtSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('dotenv', () => ({ config: jest.fn() }));
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalJwtSecret;
  });

  test('lancia un errore se JWT_SECRET non è definita', () => {
    delete process.env.JWT_SECRET;

    expect(() => require('../../app')).toThrow('JWT_SECRET non definita');
  });

  test('non lancia errori se JWT_SECRET è definita', () => {
    process.env.JWT_SECRET = 'a-secret-for-tests';

    expect(() => require('../../app')).not.toThrow();
  });
});

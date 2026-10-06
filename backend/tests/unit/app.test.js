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
    process.env.JWT_SECRET = 'a-secret-for-tests-that-is-long-enough';

    expect(() => require('../../app')).not.toThrow();
  });
});

/* la documentazione swagger espone la forma esatta di ogni endpoint, inclusi
   quelli interni come /api/admin/*: non ha senso renderla raggiungibile su
   un deploy di produzione, che non è un'api pubblica */
describe('app - documentazione swagger (/api-docs)', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('dotenv', () => ({ config: jest.fn() }));
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  test('monta /api-docs quando NODE_ENV non è "production"', async () => {
    process.env.NODE_ENV = 'test';
    const request = require('supertest');
    const app = require('../../app');

    const response = await request(app).get('/api-docs/');

    expect(response.status).toBe(200);
  });

  test('non monta /api-docs quando NODE_ENV è "production"', async () => {
    process.env.NODE_ENV = 'production';
    const request = require('supertest');
    const app = require('../../app');

    const response = await request(app).get('/api-docs/');

    expect(response.status).toBe(404);
  });
});

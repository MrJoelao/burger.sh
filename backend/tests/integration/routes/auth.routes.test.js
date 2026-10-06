const request = require('supertest');
const app = require('../../../app');
const dbHandler = require('../../helpers/dbHandler');
const { createUser } = require('../../helpers/factories');
const { hashPassword } = require('../../../utils/password');

/* test di integrazione delle rotte di autenticazione: registrazione e
   login, tramite l'app express reale e un database mongo in memoria. */

beforeAll(dbHandler.connect);
afterEach(dbHandler.clearDatabase);
afterAll(dbHandler.closeDatabase);

describe('POST /api/auth/register', () => {
  test('registra un nuovo utente e restituisce token con status 201', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Mario',
        surname: 'Rossi',
        email: 'mario@example.com',
        password: 'password123',
        role: 'customer'
      });

    expect(response.status).toBe(201);
    expect(response.body.data.token).toBeDefined();
    expect(response.body.data.user.email).toBe('mario@example.com');
  });

  test('non include managerStatus nella risposta di un customer registrato', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Mario',
        surname: 'Rossi',
        email: 'customer-senza-status@example.com',
        password: 'password123',
        role: 'customer'
      });

    expect(response.status).toBe(201);
    expect(response.body.data.user).not.toHaveProperty('managerStatus');
  });

  test('include managerStatus "pending" nella risposta di un manager appena registrato', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Luigi',
        surname: 'Verdi',
        email: 'manager@example.com',
        password: 'password1234',
        role: 'manager'
      });

    expect(response.status).toBe(201);
    expect(response.body.data.user.managerStatus).toBe('pending');
  });

  test('rifiuta la registrazione con email già in uso restituendo 409', async () => {
    await createUser({ email: 'duplicato@example.com' });

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Mario',
        surname: 'Rossi',
        email: 'duplicato@example.com',
        password: 'password123',
        role: 'customer'
      });

    expect(response.status).toBe(409);
  });

  test('rifiuta un payload non valido restituendo 400', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'M',
        surname: 'Rossi',
        email: 'non-una-email',
        password: '123',
        role: 'customer'
      });

    expect(response.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  test('effettua il login e restituisce token con status 200', async () => {
    await createUser({
      email: 'login@example.com',
      passwordHash: await hashPassword('password123')
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.body.data.token).toBeDefined();
  });

  test('non include managerStatus nella risposta di login di un customer', async () => {
    await createUser({
      email: 'customer-login@example.com',
      passwordHash: await hashPassword('password123')
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer-login@example.com', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.body.data.user).not.toHaveProperty('managerStatus');
  });

  test('rifiuta il login con email inesistente restituendo 401', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inesistente@example.com', password: 'password123' });

    expect(response.status).toBe(401);
  });

  test('rifiuta il login con password errata restituendo 401', async () => {
    await createUser({
      email: 'login2@example.com',
      passwordHash: await hashPassword('password123')
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login2@example.com', password: 'passworderrata' });

    expect(response.status).toBe(401);
  });
});

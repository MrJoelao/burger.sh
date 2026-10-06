const request = require('supertest');
const app = require('../../../app');
const dbHandler = require('../../helpers/dbHandler');
const { createAdmin, tokenFor } = require('../../helpers/factories');
const { hashPassword } = require('../../../utils/password');
const User = require('../../../models/User');

/* test di integrazione del setup al primo avvio: la creazione dell'admin usa
   i dati inviati dall'utente (email, nome, cognome, indirizzo) mentre la
   password provvisoria resta generata dal backend, e il cambio password
   forzato richiede sempre la password attuale. */

beforeAll(dbHandler.connect);
afterEach(dbHandler.clearDatabase);
afterAll(dbHandler.closeDatabase);

const validSetup = {
  email: 'capo@burger.sh',
  name: 'Ada',
  surname: 'Lovelace'
};

describe('POST /api/setup', () => {
  test('crea l\'admin con i dati inviati e una password generata', async () => {
    const response = await request(app).post('/api/setup').send(validSetup);

    expect(response.status).toBe(201);
    expect(response.body.data.adminEmail).toBe('capo@burger.sh');
    expect(typeof response.body.data.adminPassword).toBe('string');
    expect(response.body.data.adminPassword.length).toBeGreaterThan(0);

    const admin = await User.findOne({ email: 'capo@burger.sh' });
    expect(admin).not.toBeNull();
    expect(admin.role).toBe('admin');
    expect(admin.name).toBe('Ada');
    expect(admin.surname).toBe('Lovelace');
    expect(admin.mustChangePassword).toBe(true);
    expect(admin.setupCompleted).toBe(true);
    expect(admin.passwordHash).not.toBe(response.body.data.adminPassword);
  });

  test('salva l\'indirizzo facoltativo inviato con il resto dei dati', async () => {
    await request(app).post('/api/setup').send({
      ...validSetup,
      address: { street: 'Via Roma 1', city: 'Milano', zip: '20100' }
    });

    const admin = await User.findOne({ email: 'capo@burger.sh' });
    expect(admin.address.street).toBe('Via Roma 1');
    expect(admin.address.city).toBe('Milano');
    expect(admin.address.zip).toBe('20100');
  });

  test('rifiuta un\'email non valida', async () => {
    const response = await request(app)
      .post('/api/setup')
      .send({ ...validSetup, email: 'non-una-email' });

    expect(response.status).toBe(400);
  });

  test('rifiuta un secondo setup se esiste gia un admin', async () => {
    await createAdmin();

    const response = await request(app).post('/api/setup').send(validSetup);

    expect(response.status).toBe(409);
  });
});

describe('POST /api/setup/change-password', () => {
  test('rifiuta senza token', async () => {
    const response = await request(app)
      .post('/api/setup/change-password')
      .send({ currentPassword: 'provvisoria', newPassword: 'nuovaPassword1' });

    expect(response.status).toBe(401);
  });

  test('rifiuta una password attuale errata', async () => {
    const admin = await createAdmin({
      mustChangePassword: true,
      passwordHash: await hashPassword('provvisoria')
    });

    const response = await request(app)
      .post('/api/setup/change-password')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ currentPassword: 'sbagliata', newPassword: 'nuovaPassword1' });

    expect(response.status).toBe(401);
  });

  test('cambia la password e azzera mustChangePassword', async () => {
    const admin = await createAdmin({
      mustChangePassword: true,
      passwordHash: await hashPassword('provvisoria')
    });

    const response = await request(app)
      .post('/api/setup/change-password')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ currentPassword: 'provvisoria', newPassword: 'nuovaPassword1' });

    expect(response.status).toBe(200);

    const updated = await User.findById(admin._id);
    expect(updated.mustChangePassword).toBe(false);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: 'nuovaPassword1' });

    expect(login.status).toBe(200);
  });
});

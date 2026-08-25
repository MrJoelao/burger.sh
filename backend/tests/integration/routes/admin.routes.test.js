const request = require('supertest');
const app = require('../../../app');
const dbHandler = require('../../helpers/dbHandler');
const {
  createUser,
  createManager,
  createAdmin,
  createRestaurant,
  createOrder,
  tokenFor
} = require('../../helpers/factories');
const User = require('../../../models/User');
const Restaurant = require('../../../models/Restaurant');

/* test di integrazione delle rotte di amministrazione: gestione degli
   utenti (lista, dettaglio, modifica, eliminazione), approvazione dei
   manager e statistiche aggregate della piattaforma, tutte riservate
   all'admin. */

beforeAll(dbHandler.connect);
afterEach(dbHandler.clearDatabase);
afterAll(dbHandler.closeDatabase);

describe('GET /api/admin/users', () => {
  test('rifiuta con 403 un utente non admin', async () => {
    const customer = await createUser();

    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${tokenFor(customer)}`);

    expect(response.status).toBe(403);
  });

  test('un admin riceve la lista paginata degli utenti', async () => {
    const admin = await createAdmin();
    await createUser();
    await createUser();

    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${tokenFor(admin)}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(3); // 2 customer + l'admin stesso
    expect(response.body.data[0].passwordHash).toBeUndefined();
  });

  test('filtra gli utenti per ruolo e stato di approvazione', async () => {
    const admin = await createAdmin();
    await createUser({ role: 'manager', managerStatus: 'pending' });
    await createManager();

    const response = await request(app)
      .get('/api/admin/users?role=manager&managerStatus=pending')
      .set('Authorization', `Bearer ${tokenFor(admin)}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].managerStatus).toBe('pending');
  });
});

describe('GET /api/admin/users/:id', () => {
  test('un admin visualizza il dettaglio di un utente', async () => {
    const admin = await createAdmin();
    const customer = await createUser();

    const response = await request(app)
      .get(`/api/admin/users/${customer._id}`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`);

    expect(response.status).toBe(200);
    expect(response.body.data.email).toBe(customer.email);
  });

  test('restituisce 404 per un id inesistente', async () => {
    const admin = await createAdmin();
    const fakeId = '64b7a0f9a1234567890abcde';

    const response = await request(app)
      .get(`/api/admin/users/${fakeId}`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`);

    expect(response.status).toBe(404);
  });

  test('rifiuta con 403 un utente non admin', async () => {
    const customer = await createUser();
    const otherCustomer = await createUser();

    const response = await request(app)
      .get(`/api/admin/users/${otherCustomer._id}`)
      .set('Authorization', `Bearer ${tokenFor(customer)}`);

    expect(response.status).toBe(403);
  });
});

describe('PATCH /api/admin/users/:id', () => {
  test('un admin approva un manager pending', async () => {
    const admin = await createAdmin();
    const pendingManager = await createUser({ role: 'manager', managerStatus: 'pending' });

    const response = await request(app)
      .patch(`/api/admin/users/${pendingManager._id}`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ managerStatus: 'approved' });

    expect(response.status).toBe(200);
    expect(response.body.data.managerStatus).toBe('approved');

    const updatedManager = await User.findById(pendingManager._id);
    expect(updatedManager.managerStatus).toBe('approved');
  });

  test('rifiuta con 403 un utente non admin', async () => {
    const customer = await createUser();
    const pendingManager = await createUser({ role: 'manager', managerStatus: 'pending' });

    const response = await request(app)
      .patch(`/api/admin/users/${pendingManager._id}`)
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ managerStatus: 'approved' });

    expect(response.status).toBe(403);
  });

  test('restituisce 404 per un id inesistente', async () => {
    const admin = await createAdmin();
    const fakeId = '64b7a0f9a1234567890abcde';

    const response = await request(app)
      .patch(`/api/admin/users/${fakeId}`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ managerStatus: 'approved' });

    expect(response.status).toBe(404);
  });
});

describe('DELETE /api/admin/users/:id', () => {
  test('un admin elimina un customer', async () => {
    const admin = await createAdmin();
    const customer = await createUser();

    const response = await request(app)
      .delete(`/api/admin/users/${customer._id}`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`);

    expect(response.status).toBe(200);

    const deletedUser = await User.findById(customer._id);
    expect(deletedUser).toBeNull();
  });

  test('eliminando un manager proprietario senza newManagerId chiude la sua filiale', async () => {
    const admin = await createAdmin();
    const manager = await createManager();
    const restaurant = await createRestaurant({ managerId: manager._id });

    const response = await request(app)
      .delete(`/api/admin/users/${manager._id}`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`);

    expect(response.status).toBe(200);

    const remainingRestaurant = await Restaurant.findById(restaurant._id);
    expect(remainingRestaurant).toBeNull();
  });

  test('rifiuta con 403 un utente non admin', async () => {
    const customer = await createUser();
    const otherCustomer = await createUser();

    const response = await request(app)
      .delete(`/api/admin/users/${otherCustomer._id}`)
      .set('Authorization', `Bearer ${tokenFor(customer)}`);

    expect(response.status).toBe(403);
  });
});

describe('GET /api/admin/stats', () => {
  test('un admin riceve le statistiche aggregate della piattaforma', async () => {
    const admin = await createAdmin();
    await createUser();
    await createManager();
    await createRestaurant();
    await createOrder();

    const response = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${tokenFor(admin)}`);

    expect(response.status).toBe(200);
    expect(response.body.data.users.total).toBeGreaterThanOrEqual(3);
    expect(response.body.data.restaurants.total).toBeGreaterThanOrEqual(1);
    expect(response.body.data.orders.total).toBeGreaterThanOrEqual(1);
    expect(response.body.data.orders.byStatus.ordered).toBeGreaterThanOrEqual(1);
  });

  test('rifiuta con 403 un utente non admin', async () => {
    const customer = await createUser();

    const response = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${tokenFor(customer)}`);

    expect(response.status).toBe(403);
  });
});

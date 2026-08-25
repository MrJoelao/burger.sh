const request = require('supertest');
const app = require('../../../app');
const dbHandler = require('../../helpers/dbHandler');
const {
  createUser,
  createManager,
  createRestaurant,
  createDish,
  tokenFor
} = require('../../helpers/factories');
const User = require('../../../models/User');
const Restaurant = require('../../../models/Restaurant');
const Dish = require('../../../models/Dish');

/* test di integrazione delle rotte del profilo utente: visualizzazione,
   modifica ed eliminazione del proprio account, con la gestione speciale
   della filiale quando ad eliminarsi è un manager proprietario. */

beforeAll(dbHandler.connect);
afterEach(dbHandler.clearDatabase);
afterAll(dbHandler.closeDatabase);

describe('GET /api/users/me', () => {
  test('rifiuta con 401 senza token', async () => {
    const response = await request(app).get('/api/users/me');

    expect(response.status).toBe(401);
  });

  test('restituisce i dati dell\'utente autenticato senza passwordHash', async () => {
    const user = await createUser({ name: 'Luigi' });

    const response = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${tokenFor(user)}`);

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe('Luigi');
    expect(response.body.data.passwordHash).toBeUndefined();
  });
});

describe('PUT /api/users/me', () => {
  test('modifica i propri dati con successo', async () => {
    const user = await createUser();

    const response = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${tokenFor(user)}`)
      .send({ name: 'Nuovo Nome', preferences: ['vegano'] });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe('Nuovo Nome');
    expect(response.body.data.preferences).toEqual(['vegano']);
  });

  test('aggiorna la password e permette il login con la nuova password', async () => {
    const user = await createUser({ email: 'cambio@example.com' });

    const response = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${tokenFor(user)}`)
      .send({ password: 'nuovaPassword123' });

    expect(response.status).toBe(200);
    expect(response.body.data.passwordHash).toBeUndefined();

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'cambio@example.com', password: 'nuovaPassword123' });

    expect(loginResponse.status).toBe(200);
  });

  test('rifiuta con 400 un\'email in formato non valido', async () => {
    const user = await createUser();

    const response = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${tokenFor(user)}`)
      .send({ email: 'non-valida' });

    expect(response.status).toBe(400);
  });

  test('rifiuta con 401 senza token', async () => {
    const response = await request(app)
      .put('/api/users/me')
      .send({ name: 'Nuovo Nome' });

    expect(response.status).toBe(401);
  });
});

describe('DELETE /api/users/me', () => {
  test('un customer elimina il proprio account con successo', async () => {
    const customer = await createUser();

    const response = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${tokenFor(customer)}`);

    expect(response.status).toBe(200);

    const deletedUser = await User.findById(customer._id);
    expect(deletedUser).toBeNull();
  });

  test('un manager senza filiali elimina il proprio account senza effetti collaterali', async () => {
    const manager = await createManager();

    const response = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${tokenFor(manager)}`);

    expect(response.status).toBe(200);
  });

  test('un manager proprietario senza newManagerId chiude la filiale e i suoi piatti custom', async () => {
    const manager = await createManager();
    const restaurant = await createRestaurant({ managerId: manager._id });
    const customDish = await createDish({ isCustom: true, restaurantId: restaurant._id });

    const response = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${tokenFor(manager)}`);

    expect(response.status).toBe(200);

    const remainingRestaurant = await Restaurant.findById(restaurant._id);
    expect(remainingRestaurant).toBeNull();

    const remainingDish = await Dish.findById(customDish._id);
    expect(remainingDish).toBeNull();
  });

  test('un manager proprietario con newManagerId valido trasferisce la filiale', async () => {
    const manager = await createManager();
    const newManager = await createManager();
    const restaurant = await createRestaurant({ managerId: manager._id });

    const response = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${tokenFor(manager)}`)
      .send({ newManagerId: newManager._id.toString() });

    expect(response.status).toBe(200);

    const transferredRestaurant = await Restaurant.findById(restaurant._id);
    expect(transferredRestaurant.managerId.toString()).toBe(newManager._id.toString());
  });

  test('rifiuta con 400 se newManagerId non appartiene a un manager approvato', async () => {
    const manager = await createManager();
    const customer = await createUser();
    await createRestaurant({ managerId: manager._id });

    const response = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${tokenFor(manager)}`)
      .send({ newManagerId: customer._id.toString() });

    expect(response.status).toBe(400);

    const stillExisting = await User.findById(manager._id);
    expect(stillExisting).not.toBeNull();
  });

  test('rifiuta con 401 senza token', async () => {
    const response = await request(app).delete('/api/users/me');

    expect(response.status).toBe(401);
  });
});

const request = require('supertest');
const app = require('../../../app');
const dbHandler = require('../../helpers/dbHandler');
const { createUser, createPaymentMethod, tokenFor } = require('../../helpers/factories');
const PaymentMethod = require('../../../models/PaymentMethod');

/* test di integrazione delle rotte dei metodi di pagamento: CRUD ristretto
   al cliente autenticato, con verifica che un cliente non possa leggere o
   modificare i metodi di pagamento di un altro utente. */

beforeAll(dbHandler.connect);
afterEach(dbHandler.clearDatabase);
afterAll(dbHandler.closeDatabase);

describe('GET /api/users/me/payment-methods', () => {
  test('rifiuta con 401 senza token', async () => {
    const response = await request(app).get('/api/users/me/payment-methods');

    expect(response.status).toBe(401);
  });

  test('restituisce solo i metodi di pagamento del cliente autenticato', async () => {
    const customer = await createUser();
    const otherCustomer = await createUser();
    await createPaymentMethod({ customerId: customer._id, label: 'Mia carta' });
    await createPaymentMethod({ customerId: otherCustomer._id, label: 'Carta altrui' });

    const response = await request(app)
      .get('/api/users/me/payment-methods')
      .set('Authorization', `Bearer ${tokenFor(customer)}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].label).toBe('Mia carta');
  });
});

describe('GET /api/users/me/payment-methods/:id', () => {
  test('restituisce 404 se il metodo appartiene a un altro cliente', async () => {
    const customer = await createUser();
    const otherCustomer = await createUser();
    const paymentMethod = await createPaymentMethod({ customerId: otherCustomer._id });

    const response = await request(app)
      .get(`/api/users/me/payment-methods/${paymentMethod._id}`)
      .set('Authorization', `Bearer ${tokenFor(customer)}`);

    expect(response.status).toBe(404);
  });

  test('restituisce 400 con un id malformato', async () => {
    const customer = await createUser();

    const response = await request(app)
      .get('/api/users/me/payment-methods/abc')
      .set('Authorization', `Bearer ${tokenFor(customer)}`);

    expect(response.status).toBe(400);
  });
});

describe('POST /api/users/me/payment-methods', () => {
  test('crea un metodo di pagamento di tipo card', async () => {
    const customer = await createUser();

    const response = await request(app)
      .post('/api/users/me/payment-methods')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ type: 'card', label: 'Carta principale', details: '4242' });

    expect(response.status).toBe(201);
    expect(response.body.data.customerId).toBe(customer._id.toString());
    expect(response.body.data.details).toBe('4242');
  });

  test('rifiuta con 400 un metodo card senza details', async () => {
    const customer = await createUser();

    const response = await request(app)
      .post('/api/users/me/payment-methods')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ type: 'card' });

    expect(response.status).toBe(400);
  });

  test('impostare isDefault true azzera il default degli altri metodi dello stesso cliente', async () => {
    const customer = await createUser();
    const existingDefault = await createPaymentMethod({ customerId: customer._id, isDefault: true });

    const response = await request(app)
      .post('/api/users/me/payment-methods')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ type: 'cash', isDefault: true });

    expect(response.status).toBe(201);
    expect(response.body.data.isDefault).toBe(true);

    const updatedExistingDefault = await PaymentMethod.findById(existingDefault._id);
    expect(updatedExistingDefault.isDefault).toBe(false);
  });
});

describe('PUT /api/users/me/payment-methods/:id', () => {
  test('modifica il label di un proprio metodo di pagamento', async () => {
    const customer = await createUser();
    const paymentMethod = await createPaymentMethod({ customerId: customer._id });

    const response = await request(app)
      .put(`/api/users/me/payment-methods/${paymentMethod._id}`)
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ label: 'Carta lavoro' });

    expect(response.status).toBe(200);
    expect(response.body.data.label).toBe('Carta lavoro');
  });

  test('rifiuta con 404 la modifica del metodo di pagamento di un altro cliente', async () => {
    const customer = await createUser();
    const otherCustomer = await createUser();
    const paymentMethod = await createPaymentMethod({ customerId: otherCustomer._id });

    const response = await request(app)
      .put(`/api/users/me/payment-methods/${paymentMethod._id}`)
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ label: 'Carta rubata' });

    expect(response.status).toBe(404);
  });
});

describe('DELETE /api/users/me/payment-methods/:id', () => {
  test('elimina un proprio metodo di pagamento', async () => {
    const customer = await createUser();
    const paymentMethod = await createPaymentMethod({ customerId: customer._id });

    const response = await request(app)
      .delete(`/api/users/me/payment-methods/${paymentMethod._id}`)
      .set('Authorization', `Bearer ${tokenFor(customer)}`);

    expect(response.status).toBe(200);

    const deleted = await PaymentMethod.findById(paymentMethod._id);
    expect(deleted).toBeNull();
  });

  test('rifiuta con 404 l\'eliminazione del metodo di pagamento di un altro cliente', async () => {
    const customer = await createUser();
    const otherCustomer = await createUser();
    const paymentMethod = await createPaymentMethod({ customerId: otherCustomer._id });

    const response = await request(app)
      .delete(`/api/users/me/payment-methods/${paymentMethod._id}`)
      .set('Authorization', `Bearer ${tokenFor(customer)}`);

    expect(response.status).toBe(404);

    const stillExisting = await PaymentMethod.findById(paymentMethod._id);
    expect(stillExisting).not.toBeNull();
  });
});

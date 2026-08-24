const dbHandler = require('../../helpers/dbHandler');
const PaymentMethod = require('../../../models/PaymentMethod');
const { createUser } = require('../../helpers/factories');

/* test di integrazione per il modello PaymentMethod: verifica l'enum type
   (card/cash) e il campo customerId obbligatorio. nessun controller usa
   questo modello, quindi il test copre solo il modello. */

beforeAll(dbHandler.connect);
afterEach(dbHandler.clearDatabase);
afterAll(dbHandler.closeDatabase);

describe('PaymentMethod model', () => {
  test('crea un metodo di pagamento valido di tipo card', async () => {
    const customer = await createUser();

    const paymentMethod = await PaymentMethod.create({
      customerId: customer._id,
      type: 'card',
      label: 'Carta principale',
      details: '1234'
    });

    expect(paymentMethod._id).toBeDefined();
    expect(paymentMethod.type).toBe('card');
  });

  test('crea un metodo di pagamento valido di tipo cash', async () => {
    const customer = await createUser();

    const paymentMethod = await PaymentMethod.create({
      customerId: customer._id,
      type: 'cash'
    });

    expect(paymentMethod.type).toBe('cash');
  });

  test('rifiuta un metodo di pagamento senza customerId', async () => {
    await expect(PaymentMethod.create({
      type: 'card'
    })).rejects.toThrow();
  });

  test('rifiuta un metodo di pagamento senza type', async () => {
    const customer = await createUser();

    await expect(PaymentMethod.create({
      customerId: customer._id
    })).rejects.toThrow();
  });

  test('rifiuta un type non presente nell\'enum', async () => {
    const customer = await createUser();

    await expect(PaymentMethod.create({
      customerId: customer._id,
      type: 'bitcoin'
    })).rejects.toThrow();
  });
});

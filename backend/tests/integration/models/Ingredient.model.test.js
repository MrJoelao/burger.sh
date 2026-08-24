const dbHandler = require('../../helpers/dbHandler');
const Ingredient = require('../../../models/Ingredient');

/* test di integrazione per il modello Ingredient: verifica il campo name
   obbligatorio e l'array allergens. */

beforeAll(dbHandler.connect);
afterEach(dbHandler.clearDatabase);
afterAll(dbHandler.closeDatabase);

describe('Ingredient model', () => {
  test('crea un ingrediente valido con name e allergens', async () => {
    const ingredient = await Ingredient.create({
      name: 'Formaggio',
      allergens: ['lattosio']
    });

    expect(ingredient._id).toBeDefined();
    expect(ingredient.name).toBe('Formaggio');
    expect(ingredient.allergens).toEqual(['lattosio']);
  });

  test('crea un ingrediente valido senza allergens (array vuoto di default)', async () => {
    const ingredient = await Ingredient.create({ name: 'Insalata' });

    expect(ingredient.allergens).toEqual([]);
  });

  test('rifiuta un ingrediente senza name', async () => {
    await expect(Ingredient.create({
      allergens: ['glutine']
    })).rejects.toThrow();
  });

  test('accetta più allergeni nello stesso array', async () => {
    const ingredient = await Ingredient.create({
      name: 'Pane',
      allergens: ['glutine', 'lattosio', 'uova']
    });

    expect(ingredient.allergens).toHaveLength(3);
  });
});

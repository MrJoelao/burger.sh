const { createIngredientSchema } = require('@validations/ingredientValidation');

describe('ingredientValidation', () => {
  test('accetta gli allergeni associati all ingrediente', () => {
    const { error, value } = createIngredientSchema.validate({
      name: 'Cheddar',
      allergens: ['lattosio']
    });

    expect(error).toBeUndefined();
    expect(value.allergens).toEqual(['lattosio']);
  });

  test('usa una lista vuota quando gli allergeni non sono specificati', () => {
    const { error, value } = createIngredientSchema.validate({ name: 'Lattuga' });

    expect(error).toBeUndefined();
    expect(value.allergens).toEqual([]);
  });
});

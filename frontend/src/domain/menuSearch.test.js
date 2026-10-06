import { filterDishes } from './menuSearch.js';

const DISHES = [
  {
    name: 'Cheeseburger',
    type: 'burger',
    price: 8,
    ingredientIds: [
      { name: 'pane', allergens: ['glutine'] },
      { name: 'cheddar', allergens: ['lattosio'] }
    ]
  },
  {
    name: 'Burger vegano',
    type: 'burger',
    price: 9,
    ingredientIds: [{ name: 'lattuga', allergens: [] }]
  }
];

describe('filterDishes', () => {
  test('combina testo, tipologia e fascia di prezzo', () => {
    expect(filterDishes(DISHES, {
      query: 'veg',
      type: 'burger',
      minPrice: '8.50',
      maxPrice: '9'
    })).toEqual([DISHES[1]]);
  });

  test('esclude i piatti che contengono uno degli allergeni selezionati', () => {
    expect(filterDishes(DISHES, { excludedAllergens: ['lattosio'] })).toEqual([DISHES[1]]);
  });

  test('cerca anche negli ingredienti', () => {
    expect(filterDishes(DISHES, { query: 'cheddar' })).toEqual([DISHES[0]]);
  });
});

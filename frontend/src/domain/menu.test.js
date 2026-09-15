import {
  canManageDish,
  dishBranchId,
  dishFormErrors,
  dishPayload,
  isCustomDish,
  menuGroups,
  typeComposition
} from './menu.js';

describe('menu domain', () => {
  test('isCustomDish riconosce solo i piatti custom', () => {
    expect(isCustomDish({ isCustom: true })).toBe(true);
    expect(isCustomDish({ isCustom: false })).toBe(false);
    expect(isCustomDish(null)).toBe(false);
  });

  test('dishBranchId legge id grezzo o documento popolato', () => {
    expect(dishBranchId({ restaurantId: 'r1' })).toBe('r1');
    expect(dishBranchId({ restaurantId: { _id: 'r1' } })).toBe('r1');
    expect(dishBranchId({ restaurantId: null })).toBe('');
    expect(dishBranchId({})).toBe('');
  });

  test('canManageDish: il manager gestisce solo i custom della propria sede', () => {
    const user = { role: 'manager', restaurantId: 'r1' };

    expect(canManageDish({ isCustom: true, restaurantId: 'r1' }, user)).toBe(true);
    expect(canManageDish({ isCustom: true, restaurantId: { _id: 'r1' } }, user)).toBe(true);
    expect(canManageDish({ isCustom: false, restaurantId: null }, user)).toBe(false);
    expect(canManageDish({ isCustom: true, restaurantId: 'r9' }, user)).toBe(false);
    expect(canManageDish({ isCustom: true, restaurantId: 'r1' }, { role: 'customer' })).toBe(false);
  });

  test('menuGroups separa custom e comune', () => {
    const dishes = [
      { name: 'comune', isCustom: false },
      { name: 'custom', isCustom: true }
    ];

    const { custom, common } = menuGroups(dishes);
    expect(custom.map(dish => dish.name)).toEqual(['custom']);
    expect(common.map(dish => dish.name)).toEqual(['comune']);
    expect(menuGroups()).toEqual({ custom: [], common: [] });
  });

  test('dishFormErrors applica i vincoli di CreateDishRequest', () => {
    expect(dishFormErrors({ name: 'a', type: 'b', price: '0' })).toEqual({
      name: 'almeno 2 caratteri',
      type: 'almeno 2 caratteri',
      price: 'prezzo maggiore di zero'
    });
    expect(dishFormErrors({ name: 'Burger', type: 'burger', price: '6.5' })).toEqual({});
    expect(dishFormErrors({ name: 'Burger', type: 'burger', price: '' }).price)
      .toBe('prezzo maggiore di zero');
  });

  test('dishPayload normalizza e omette la foto vuota', () => {
    expect(dishPayload({ name: ' X ', type: ' burger ', price: '6.5', photoUrl: '  ' }))
      .toEqual({ name: 'X', type: 'burger', price: 6.5 });
    expect(dishPayload({ name: 'X', type: 'burger', price: '1', photoUrl: 'https://a/b.png' }))
      .toEqual({ name: 'X', type: 'burger', price: 1, photoUrl: 'https://a/b.png' });
  });

  test('typeComposition conta per tipologia in ordine decrescente', () => {
    const segments = typeComposition([{ type: 'burger' }, { type: 'burger' }, { type: 'drink' }]);

    expect(segments).toEqual([
      { key: 'burger', label: 'burger', value: 2 },
      { key: 'drink', label: 'drink', value: 1 }
    ]);
    expect(typeComposition()).toEqual([]);
  });
});

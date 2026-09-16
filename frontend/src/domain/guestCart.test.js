import {
  addGuestCartItem,
  changeGuestCartQuantity,
  guestCartFor,
  saveGuestCart
} from './guestCart.js';

const CHEESEBURGER = { _id: 'd1', name: 'Cheeseburger', price: 6.5 };

describe('guestCart', () => {
  beforeEach(() => localStorage.clear());

  test('salva il carrello ospite per filiale e lo ripristina dal browser', () => {
    const items = addGuestCartItem([], CHEESEBURGER);
    const updatedItems = changeGuestCartQuantity(items, 'd1', 2);

    saveGuestCart('r1', updatedItems);

    expect(guestCartFor('r1')).toEqual([
      { dishId: 'd1', name: 'Cheeseburger', price: 6.5, quantity: 2 }
    ]);
    expect(guestCartFor('r2')).toEqual([]);
  });
});

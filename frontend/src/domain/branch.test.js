import { branchIdOf, branchErrors, branchForm, branchPayload } from './branch.js';

describe('branch domain', () => {
  test('branchIdOf preferisce restaurantId, poi restaurant._id', () => {
    expect(branchIdOf({ restaurantId: 'r1', restaurant: { _id: 'r2' } })).toBe('r1');
    expect(branchIdOf({ restaurant: { _id: 'r2' } })).toBe('r2');
    expect(branchIdOf({})).toBe('');
    expect(branchIdOf(null)).toBe('');
  });

  test('branchForm prende i soli campi della sede', () => {
    expect(branchForm({ name: 'Sede', city: 'Milano', extra: 'x' })).toEqual({
      name: 'Sede',
      address: '',
      city: 'Milano',
      phone: '',
      vatNumber: ''
    });
    expect(branchForm()).toEqual({ name: '', address: '', city: '', phone: '', vatNumber: '' });
  });

  test('branchErrors applica i vincoli di UpdateRestaurantRequest', () => {
    expect(branchErrors({ name: 'a', address: 'via', city: 'm', phone: 'abc', vatNumber: '' })).toEqual({
      name: 'almeno 2 caratteri',
      address: 'almeno 5 caratteri',
      city: 'almeno 2 caratteri',
      phone: 'telefono non valido',
      vatNumber: 'partita iva richiesta'
    });

    expect(branchErrors({
      name: 'Sede',
      address: 'Via Roma 1',
      city: 'Milano',
      phone: '+39 02 123',
      vatNumber: 'IT1'
    })).toEqual({});
  });

  test('branchPayload restituisce i campi ripuliti', () => {
    expect(branchPayload({ name: ' Sede ', address: 'Via 1', city: 'MI', phone: '111', vatNumber: 'V' }))
      .toEqual({ name: 'Sede', address: 'Via 1', city: 'MI', phone: '111', vatNumber: 'V' });
  });
});

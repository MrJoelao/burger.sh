import {
  passwordErrors,
  profileSections,
  ownedBranches,
  successorManagers,
  preferenceLabel,
  PREFERENCE_GROUPS
} from './profile.js';

describe('profile domain', () => {
  test('le preferenze sono raggruppate per famiglia', () => {
    const values = PREFERENCE_GROUPS.flatMap(group => group.values);
    expect(values).toEqual([
      'vegetariano',
      'vegano',
      'senza_glutine',
      'piccante',
      'offerte_speciali',
      'consegna_rapida',
      'ritiro_in_sede'
    ]);
  });

  test('preferenceLabel rende leggibile il valore', () => {
    expect(preferenceLabel('senza_glutine')).toBe('senza glutine');
  });

  test('profileSections include preferenze solo per il cliente', () => {
    expect(profileSections('customer').map(section => section.id))
      .toEqual(['anagrafica', 'indirizzo', 'preferenze', 'sicurezza', 'account']);
    expect(profileSections('manager').map(section => section.id))
      .toEqual(['anagrafica', 'indirizzo', 'sicurezza', 'account']);
    expect(profileSections('admin').map(section => section.id))
      .toEqual(['anagrafica', 'indirizzo', 'sicurezza', 'account']);
  });

  test('gli indici delle sezioni sono progressivi a due cifre', () => {
    expect(profileSections('customer').map(section => section.index))
      .toEqual(['01', '02', '03', '04', '05']);
  });

  test('passwordErrors segnala la password mancante', () => {
    expect(passwordErrors({ password: '', confirmPassword: '' }).password)
      .toBe('nuova password richiesta');
  });

  test('passwordErrors segnala la password sotto il minimo', () => {
    expect(passwordErrors({ password: 'abc', confirmPassword: 'abc' }).password)
      .toBe('almeno 6 caratteri');
  });

  test('passwordErrors segnala la conferma diversa', () => {
    expect(passwordErrors({ password: 'segreta', confirmPassword: 'diversa' }).confirmPassword)
      .toBe('le password non coincidono');
  });

  test('passwordErrors non segnala nulla con una password valida', () => {
    expect(passwordErrors({ password: 'segreta', confirmPassword: 'segreta' })).toEqual({});
  });

  test('ownedBranches tiene solo le filiali del manager, gestendo id popolato o grezzo', () => {
    const restaurants = [
      { name: 'A', managerId: { id: 'm1' } },
      { name: 'B', managerId: { id: 'm9' } },
      { name: 'C', managerId: 'm1' }
    ];

    expect(ownedBranches(restaurants, 'm1').map(restaurant => restaurant.name)).toEqual(['A', 'C']);
  });

  test('successorManagers elenca i manager diversi da sé, senza duplicati', () => {
    const restaurants = [
      { managerId: { id: 'm1', name: 'Joel' } },
      { managerId: { id: 'm9', name: 'Ada' } },
      { managerId: { id: 'm9', name: 'Ada' } }
    ];

    expect(successorManagers(restaurants, 'm1').map(manager => manager.id)).toEqual(['m9']);
  });
});

const { isAdmin, isManager, isCustomer, isOwner, unauthorized } = require('@utils/authorization');

describe('authorization utils', () => {
  describe('isAdmin', () => {
    test('ritorna true se l\'utente ha ruolo admin', () => {
      expect(isAdmin({ role: 'admin' })).toBe(true);
    });

    test('ritorna false se l\'utente ha un altro ruolo', () => {
      expect(isAdmin({ role: 'customer' })).toBe(false);
    });

    test('ritorna false se l\'utente non è definito', () => {
      expect(isAdmin(undefined)).toBe(false);
    });
  });

  describe('isManager', () => {
    test('ritorna true se l\'utente ha ruolo manager', () => {
      expect(isManager({ role: 'manager' })).toBe(true);
    });

    test('ritorna false se l\'utente ha un altro ruolo', () => {
      expect(isManager({ role: 'admin' })).toBe(false);
    });
  });

  describe('isCustomer', () => {
    test('ritorna true se l\'utente ha ruolo customer', () => {
      expect(isCustomer({ role: 'customer' })).toBe(true);
    });

    test('ritorna false se l\'utente ha un altro ruolo', () => {
      expect(isCustomer({ role: 'manager' })).toBe(false);
    });
  });

  describe('isOwner', () => {
    test('ritorna true se ownerId e userId coincidono', () => {
      expect(isOwner('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439011')).toBe(true);
    });

    test('ritorna false se ownerId e userId sono diversi', () => {
      expect(isOwner('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439099')).toBe(false);
    });

    test('confronta anche oggetti con toString (es. ObjectId)', () => {
      const ownerId = { toString: () => 'abc123' };
      const userId = { toString: () => 'abc123' };
      expect(isOwner(ownerId, userId)).toBe(true);
    });

    test('ritorna false se ownerId non è definito', () => {
      expect(isOwner(null, '507f1f77bcf86cd799439011')).toBe(false);
    });

    test('ritorna false se userId non è definito', () => {
      expect(isOwner('507f1f77bcf86cd799439011', null)).toBe(false);
    });
  });

  describe('unauthorized', () => {
    test('ritorna un oggetto con i valori di default', () => {
      // act
      const result = unauthorized();

      // assert
      expect(result).toEqual({
        authorized: false,
        statusCode: 403,
        message: 'Not authorized to perform this operation'
      });
    });

    test('permette di sovrascrivere messaggio e statusCode', () => {
      // act
      const result = unauthorized('accesso negato', 401);

      // assert
      expect(result).toEqual({
        authorized: false,
        statusCode: 401,
        message: 'accesso negato'
      });
    });
  });
});

const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');

const { signUser, verifyToken } = require('@utils/jwt');

describe('jwt utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signUser', () => {
    test('firma un token con id e ruolo estratti dall\'utente', () => {
      // arrange
      const user = { _id: { toString: () => '507f1f77bcf86cd799439011' }, role: 'customer' };
      jwt.sign.mockReturnValue('signed-token');

      // act
      const token = signUser(user);

      // assert
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: '507f1f77bcf86cd799439011', role: 'customer' },
        process.env.JWT_SECRET,
        { expiresIn: '3h' }
      );
      expect(token).toBe('signed-token');
    });

    test('converte l\'_id in stringa anche se non è già una stringa', () => {
      // arrange
      const user = { _id: 12345, role: 'admin' };
      jwt.sign.mockReturnValue('another-token');

      // act
      signUser(user);

      // assert
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ id: '12345', role: 'admin' }),
        process.env.JWT_SECRET,
        expect.anything()
      );
    });
  });

  describe('verifyToken', () => {
    test('ritorna la payload quando il token è valido', () => {
      // arrange
      const payload = { id: 'abc', role: 'manager' };
      jwt.verify.mockReturnValue(payload);

      // act
      const result = verifyToken('valid-token');

      // assert
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
      expect(result).toEqual(payload);
    });

    test('propaga l\'errore quando il token non è valido', () => {
      // arrange
      jwt.verify.mockImplementation(() => {
        throw new Error('invalid signature');
      });

      // act & assert
      expect(() => verifyToken('bad-token')).toThrow('invalid signature');
    });
  });
});

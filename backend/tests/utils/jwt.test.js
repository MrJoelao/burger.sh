const jwt = require('jsonwebtoken');
const { signUser, verifyToken } = require('@utils/jwt');

const mockObjectId = { toString: () => '507f1f77bcf86cd799439011' };

describe('utils/jwt.js', () => {
  const TEST_SECRET = 'test-secret';

  beforeAll(() => {
    process.env.JWT_SECRET = TEST_SECRET;
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signUser()', () => {
    it('should return a string token', () => {
      const fakeUser = {
        _id: mockObjectId,
        role: 'customer'
      };

      const token = signUser(fakeUser);

      expect(typeof token).toBe('string');
      expect(token).not.toBe('');
    });

    it('should include user id and role in the payload', () => {
      const fakeUser = {
        _id: mockObjectId,
        role: 'manager'
      };

      const token = signUser(fakeUser);
      const decoded = jwt.decode(token, { complete: true });

      expect(decoded.payload.id).toBe('507f1f77bcf86cd799439011');
      expect(decoded.payload.role).toBe('manager');
    });

    it('should include an exp claim in the token', () => {
      const fakeUser = {
        _id: mockObjectId,
        role: 'customer'
      };

      const token = signUser(fakeUser);
      const decoded = jwt.decode(token);

      expect(decoded.exp).toBeDefined();
      expect(typeof decoded.exp).toBe('number');
    });
  });

  describe('verifyToken()', () => {
    it('should return decoded payload with id and role for valid token', () => {
      const fakeUser = {
        _id: mockObjectId,
        role: 'customer'
      };
      const token = signUser(fakeUser);

      const payload = verifyToken(token);

      expect(payload.id).toBe('507f1f77bcf86cd799439011');
      expect(payload.role).toBe('customer');
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => verifyToken(invalidToken)).toThrow();
    });

    it('should throw error for expired token', () => {
      const fakeUser = {
        _id: mockObjectId,
        role: 'customer'
      };

      // Crea token con secret di test e scadenza 1ms
      const token = jwt.sign(
        { id: fakeUser._id.toString(), role: fakeUser.role },
        TEST_SECRET,
        { expiresIn: '1ms' }
      );

      // Aspetta che scada
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(() => verifyToken(token)).toThrow();
          resolve();
        }, 10);
      });
    });
  });
});

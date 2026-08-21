const { hashPassword, comparePassword } = require('@utils/password');

describe('utils/password.js', () => {
  describe('hashPassword()', () => {
    it('should return a string different from the plain password', async () => {
      const plainPassword = 'testPassword123';
      const hash = await hashPassword(plainPassword);

      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(plainPassword);
      expect(hash).toHaveLength(60);
    });

    it('should generate different hashes for the same password', async () => {
      const plainPassword = 'samePassword';
      const hash1 = await hashPassword(plainPassword);
      const hash2 = await hashPassword(plainPassword);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword()', () => {
    it('should return true when password matches the hash', async () => {
      const plainPassword = 'correctPassword';
      const hash = await hashPassword(plainPassword);

      const isValid = await comparePassword(plainPassword, hash);

      expect(isValid).toBe(true);
    });

    it('should return false when password does not match the hash', async () => {
      const plainPassword = 'correctPassword';
      const wrongPassword = 'wrongPassword';
      const hash = await hashPassword(plainPassword);

      const isValid = await comparePassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    it('should return false when hash is invalid', async () => {
      const plainPassword = 'testPassword';
      const invalidHash = 'invalidHashThatDoesNotExist';

      const isValid = await comparePassword(plainPassword, invalidHash);

      expect(isValid).toBe(false);
    });
  });
});

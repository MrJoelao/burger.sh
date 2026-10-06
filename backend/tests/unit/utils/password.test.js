const { hashPassword, comparePassword } = require('@utils/password');

describe('password utils', () => {
  describe('hashPassword', () => {
    test('genera un hash diverso dalla password in chiaro', async () => {
      // arrange
      const plainPassword = 'SuperSegreta123';

      // act
      const hash = await hashPassword(plainPassword);

      // assert
      expect(hash).toEqual(expect.any(String));
      expect(hash).not.toBe(plainPassword);
    });

    test('genera hash diversi per la stessa password (salt casuale)', async () => {
      // arrange
      const plainPassword = 'SuperSegreta123';

      // act
      const hash1 = await hashPassword(plainPassword);
      const hash2 = await hashPassword(plainPassword);

      // assert
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    test('ritorna true se la password in chiaro corrisponde all\'hash', async () => {
      // arrange
      const plainPassword = 'SuperSegreta123';
      const hash = await hashPassword(plainPassword);

      // act
      const isMatch = await comparePassword(plainPassword, hash);

      // assert
      expect(isMatch).toBe(true);
    });

    test('ritorna false se la password in chiaro non corrisponde all\'hash', async () => {
      // arrange
      const hash = await hashPassword('PasswordCorretta');

      // act
      const isMatch = await comparePassword('PasswordSbagliata', hash);

      // assert
      expect(isMatch).toBe(false);
    });
  });
});

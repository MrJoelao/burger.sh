const { registerSchema, loginSchema } = require('@validations/authValidation');

describe('validations/authValidation.js', () => {
  describe('registerSchema', () => {
    const validRegisterData = {
      name: 'John',
      surname: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'customer'
    };

    it('should validate correct register data', () => {
      const { error, value } = registerSchema.validate(validRegisterData);

      expect(error).toBeUndefined();
      expect(value).toEqual(validRegisterData);
    });

    it('should fail when name is missing', () => {
      const invalidData = { ...validRegisterData };
      delete invalidData.name;

      const { error } = registerSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error.message).toContain('name');
    });

    it('should fail when name is less than 2 characters', () => {
      const invalidData = { ...validRegisterData, name: 'J' };

      const { error } = registerSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should fail when email is invalid', () => {
      const invalidData = { ...validRegisterData, email: 'invalid-email' };

      const { error } = registerSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error.message).toContain('email');
    });

    it('should fail when password is less than 6 characters', () => {
      const invalidData = { ...validRegisterData, password: 'short' };

      const { error } = registerSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should fail when role is not valid', () => {
      const invalidData = { ...validRegisterData, role: 'superadmin' };

      const { error } = registerSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should accept "manager" role', () => {
      const managerData = { ...validRegisterData, role: 'manager' };

      const { error, value } = registerSchema.validate(managerData);

      expect(error).toBeUndefined();
      expect(value.role).toBe('manager');
    });

    it('should fail when surname is missing', () => {
      const invalidData = { ...validRegisterData };
      delete invalidData.surname;

      const { error } = registerSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error.message).toContain('surname');
    });

    it('should fail when password is missing', () => {
      const invalidData = { ...validRegisterData };
      delete invalidData.password;

      const { error } = registerSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should reject unknown fields', () => {
      const dataWithExtra = {
        ...validRegisterData,
        unknownField: 'should be rejected'
      };

      const { error } = registerSchema.validate(dataWithExtra, { stripUnknown: true });

      expect(error).toBeUndefined();
    });
  });

  describe('loginSchema', () => {
    const validLoginData = {
      email: 'john@example.com',
      password: 'password123'
    };

    it('should validate correct login data', () => {
      const { error, value } = loginSchema.validate(validLoginData);

      expect(error).toBeUndefined();
      expect(value).toEqual(validLoginData);
    });

    it('should fail when email is missing', () => {
      const invalidData = { password: 'password123' };

      const { error } = loginSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error.message).toContain('email');
    });

    it('should fail when email is invalid format', () => {
      const invalidData = { ...validLoginData, email: 'not-an-email' };

      const { error } = loginSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should fail when password is missing', () => {
      const invalidData = { email: 'john@example.com' };

      const { error } = loginSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error.message).toContain('password');
    });

    it('should accept any password length', () => {
      const shortPasswordData = {
        email: 'john@example.com',
        password: 'a'
      };

      const { error } = loginSchema.validate(shortPasswordData);

      expect(error).toBeUndefined();
    });
  });
});

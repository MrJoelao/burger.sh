jest.mock('@models/User', () => ({
  findOne: jest.fn(),
  create: jest.fn()
}));

jest.mock('@utils/password', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn()
}));

jest.mock('@utils/jwt', () => ({
  signUser: jest.fn()
}));

const authController = require('@controllers/authController');
const User = require('@models/User');
const { hashPassword, comparePassword } = require('@utils/password');
const { signUser } = require('@utils/jwt');

describe('controllers/authController.js', () => {
  let req, res, next;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'John',
    surname: 'Doe',
    email: 'john@example.com',
    role: 'customer',
    passwordHash: 'hashedPassword123',
    toJSON() {
      return {
        _id: this._id,
        name: this.name,
        surname: this.surname,
        email: this.email,
        role: this.role
      };
    }
  };

  beforeEach(() => {
    req = { validated: {}, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('register()', () => {
    const validRegisterData = {
      name: 'John',
      surname: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'customer'
    };

    it('should return 409 when email already exists', async () => {
      User.findOne.mockResolvedValue(mockUser);
      req.validated = { ...validRegisterData };

      await authController.register(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(User.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Email')
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should create new customer when email is free', async () => {
      User.findOne.mockResolvedValue(null);
      hashPassword.mockResolvedValue('hashedPassword123');
      User.create.mockResolvedValue({
        ...mockUser,
        passwordHash: 'hashedPassword123',
        toJSON: mockUser.toJSON
      });
      signUser.mockReturnValue('fake-jwt-token');

      req.validated = { ...validRegisterData };

      await authController.register(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(hashPassword).toHaveBeenCalledWith('password123');
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John',
          surname: 'Doe',
          email: 'john@example.com',
          passwordHash: 'hashedPassword123',
          role: 'customer'
        })
      );
      expect(signUser).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            token: 'fake-jwt-token',
            user: expect.objectContaining({
              email: 'john@example.com',
              role: 'customer'
            })
          })
        })
      );
      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.user.passwordHash).toBeUndefined();
    });

    it('should set managerStatus to pending for manager role', async () => {
      User.findOne.mockResolvedValue(null);
      hashPassword.mockResolvedValue('hashedPassword123');
      User.create.mockResolvedValue({
        ...mockUser,
        role: 'manager',
        managerStatus: 'pending',
        passwordHash: 'hashedPassword123',
        toJSON() {
          return {
            _id: this._id,
            name: this.name,
            surname: this.surname,
            email: this.email,
            role: this.role,
            managerStatus: this.managerStatus
          };
        }
      });
      signUser.mockReturnValue('fake-jwt-token');

      req.validated = { ...validRegisterData, role: 'manager' };

      await authController.register(req, res, next);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'manager',
          managerStatus: 'pending'
        })
      );
      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.user.managerStatus).toBe('pending');
    });

    it('should not set managerStatus for customer role', async () => {
      User.findOne.mockResolvedValue(null);
      hashPassword.mockResolvedValue('hashedPassword123');
      User.create.mockResolvedValue({
        ...mockUser,
        passwordHash: 'hashedPassword123',
        toJSON: mockUser.toJSON
      });
      signUser.mockReturnValue('fake-jwt-token');

      req.validated = { ...validRegisterData, role: 'customer' };

      await authController.register(req, res, next);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'customer'
        })
      );
      const createCall = User.create.mock.calls[0][0];
      expect(createCall.managerStatus).toBeUndefined();
    });
  });

  describe('login()', () => {
    const validLoginData = {
      email: 'john@example.com',
      password: 'password123'
    };

    it('should return 401 when email does not exist', async () => {
      User.findOne.mockResolvedValue(null);
      req.validated = { ...validLoginData };

      await authController.login(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(comparePassword).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Invalid')
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when password is wrong', async () => {
      User.findOne.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(false);
      req.validated = { ...validLoginData };

      await authController.login(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(comparePassword).toHaveBeenCalledWith('password123', 'hashedPassword123');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Invalid')
        })
      );
      expect(signUser).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return token and user when credentials are correct', async () => {
      User.findOne.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);
      signUser.mockReturnValue('fake-jwt-token');
      req.validated = { ...validLoginData };

      await authController.login(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(comparePassword).toHaveBeenCalledWith('password123', 'hashedPassword123');
      expect(signUser).toHaveBeenCalledWith(mockUser);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            token: 'fake-jwt-token',
            user: expect.objectContaining({
              email: 'john@example.com',
              role: 'customer'
            })
          })
        })
      );
      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.user.passwordHash).toBeUndefined();
    });
  });
});

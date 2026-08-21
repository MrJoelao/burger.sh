jest.mock('@utils/jwt', () => ({
  verifyToken: jest.fn()
}));

const authMiddleware = require('@middlewares/authMiddleware');
const { verifyToken } = require('@utils/jwt');

describe('middlewares/authMiddleware.js', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 401 when Authorization header is missing', () => {
    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Missing token or invalid format'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token format is invalid (no Bearer prefix)', () => {
    req.headers.authorization = 'InvalidFormat token123';

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Missing token or invalid format'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token verification fails', () => {
    req.headers.authorization = 'Bearer invalidToken';
    verifyToken.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid or expired token'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should set req.user and call next() when token is valid', () => {
    req.headers.authorization = 'Bearer validToken';
    const mockPayload = { id: '507f1f77bcf86cd799439011', role: 'customer' };
    verifyToken.mockReturnValue(mockPayload);

    authMiddleware(req, res, next);

    expect(req.user).toEqual(mockPayload);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should extract token correctly from Bearer prefix', () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token.signature';
    req.headers.authorization = `Bearer ${token}`;
    verifyToken.mockReturnValue({ id: '123', role: 'manager' });

    authMiddleware(req, res, next);

    expect(verifyToken).toHaveBeenCalledWith(token);
    expect(next).toHaveBeenCalled();
  });

  it('should set correct user data on req.user', () => {
    req.headers.authorization = 'Bearer token123';
    const userData = {
      id: '507f1f77bcf86cd799439011',
      role: 'manager'
    };
    verifyToken.mockReturnValue(userData);

    authMiddleware(req, res, next);

    expect(req.user).toBe(userData);
    expect(req.user.id).toBe('507f1f77bcf86cd799439011');
    expect(req.user.role).toBe('manager');
  });

  it('should handle expired token error', () => {
    req.headers.authorization = 'Bearer expiredToken';
    verifyToken.mockImplementation(() => {
      const error = new Error('jwt expired');
      throw error;
    });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid or expired token'
    });
  });
});

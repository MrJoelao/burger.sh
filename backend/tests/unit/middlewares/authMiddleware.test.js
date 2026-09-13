const authMiddleware = require('@middlewares/authMiddleware');
const { signUser } = require('@utils/jwt');
const User = require('@models/User');

jest.mock('@models/User');

function createMockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('authMiddleware', () => {
  let res, next;

  beforeEach(() => {
    res = createMockRes();
    next = jest.fn();
    User.findById.mockReset();
  });

  test("risponde con 401 se manca l'header Authorization", () => {
    const req = { headers: {} };

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      type: 'https://httpstatuses.org/401',
      title: 'Missing token or invalid format',
      status: 401,
      detail: 'Missing token or invalid format'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("risponde con 401 se l'header non inizia con 'Bearer '", () => {
    const req = { headers: { authorization: 'Token abc123' } };

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      type: 'https://httpstatuses.org/401',
      title: 'Missing token or invalid format',
      status: 401,
      detail: 'Missing token or invalid format'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('risponde con 401 se il token non è valido', async () => {
    const req = { headers: { authorization: 'Bearer ' + 'bad-token' }, ip: '127.0.0.1' };

    authMiddleware(req, res, next);
    await new Promise((resolve) => setImmediate(resolve));

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      type: 'https://httpstatuses.org/401',
      title: 'Invalid or expired token',
      status: 401,
      detail: 'Invalid or expired token'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('popola req.user e chiama next quando il token è valido', async () => {
    const token = signUser({ _id: '507f1f77bcf86cd799439011', role: 'customer' });
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: { toString: () => '507f1f77bcf86cd799439011' },
        role: 'customer',
        mustChangePassword: false
      })
    });
    const req = { headers: { authorization: 'Bearer ' + token }, path: '/api/users/me' };

    authMiddleware(req, res, next);
    await new Promise((resolve) => setImmediate(resolve));

    expect(req.user).toEqual(
      expect.objectContaining({ id: '507f1f77bcf86cd799439011', role: 'customer' })
    );
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('risponde con 403 se mustChangePassword è attivo fuori da setup/change-password', async () => {
    const token = signUser({ _id: '507f1f77bcf86cd799439011', role: 'customer' });
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: { toString: () => '507f1f77bcf86cd799439011' },
        role: 'customer',
        mustChangePassword: true
      })
    });
    const req = { headers: { authorization: 'Bearer ' + token }, path: '/api/users/me' };

    authMiddleware(req, res, next);
    await new Promise((resolve) => setImmediate(resolve));

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      type: 'https://httpstatuses.org/403',
      title: 'Password change required. Please change your password before accessing this resource.',
      status: 403,
      detail: 'Password change required. Please change your password before accessing this resource.'
    });
    expect(next).not.toHaveBeenCalled();
  });
});

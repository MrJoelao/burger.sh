const authMiddleware = require('@middlewares/authMiddleware');
const { signUser } = require('@utils/jwt');

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
  });

  test('risponde con 401 se manca l\'header Authorization', () => {
    // arrange
    const req = { headers: {} };

    // act
    authMiddleware(req, res, next);

    // assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Missing token or invalid format'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('risponde con 401 se l\'header non inizia con "Bearer "', () => {
    // arrange
    const req = { headers: { authorization: 'Token abc123' } };

    // act
    authMiddleware(req, res, next);

    // assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Missing token or invalid format'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('risponde con 401 se il token non è valido', async () => {
    // arrange
    const req = { headers: { authorization: 'Bearer token-fasullo' }, ip: '127.0.0.1' };

    // act
    authMiddleware(req, res, next);
    // anche qui il rate limiter per i token non validi risolve in modo asincrono
    await new Promise((resolve) => setImmediate(resolve));

    // assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid or expired token'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('popola req.user e chiama next quando il token è valido', async () => {
    // arrange
    const token = signUser({ _id: '507f1f77bcf86cd799439011', role: 'customer' });
    const req = { headers: { authorization: `Bearer ${token}` } };

    // act
    authMiddleware(req, res, next);
    // i rate limiter di express-rate-limit risolvono in modo asincrono, quindi aspetto il prossimo tick
    await new Promise((resolve) => setImmediate(resolve));

    // assert
    expect(req.user).toEqual(
      expect.objectContaining({ id: '507f1f77bcf86cd799439011', role: 'customer' })
    );
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

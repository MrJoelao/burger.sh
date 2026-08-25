const { requireRole, requireAdmin } = require('@middlewares/roleMiddleware');

function createMockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('roleMiddleware', () => {
  let res, next;

  beforeEach(() => {
    res = createMockRes();
    next = jest.fn();
  });

  describe('requireRole', () => {
    test('chiama next quando req.user ha uno dei ruoli ammessi', () => {
      // arrange
      const req = { user: { role: 'manager' } };

      // act
      requireRole('manager', 'admin')(req, res, next);

      // assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    test('risponde con 403 e un messaggio che elenca i ruoli ammessi quando il ruolo non è tra quelli richiesti', () => {
      // arrange
      const req = { user: { role: 'customer' } };

      // act
      requireRole('manager', 'admin')(req, res, next);

      // assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Only manager or admin can perform this operation'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('risponde con 403 quando req.user non è definito', () => {
      // arrange
      const req = {};

      // act
      requireRole('admin')(req, res, next);

      // assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    test('chiama next quando req.user è admin', () => {
      // arrange
      const req = { user: { role: 'admin' } };

      // act
      requireAdmin(req, res, next);

      // assert
      expect(next).toHaveBeenCalledTimes(1);
    });

    test('risponde con 403 e il messaggio specifico per admin quando req.user non è admin', () => {
      // arrange
      const req = { user: { role: 'manager' } };

      // act
      requireAdmin(req, res, next);

      // assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Only admin can perform this operation'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});

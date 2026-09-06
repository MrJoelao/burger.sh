jest.mock('@models/User', () => ({
  findById: jest.fn()
}));

const User = require('@models/User');
const { requireRole, requireAdmin, requireApprovedManager } = require('@middlewares/roleMiddleware');
const errorHandler = require('@middlewares/errorHandler');

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

    test('requireRole › risponde con 403 e un messaggio che elenca i ruoli ammessi quando il ruolo non è tra quelli richiesti', () => {
      // arrange
      const req = {};
      const err = new Error('Only manager or admin can perform this operation');
      err.status = 403;

      // act
      errorHandler(err, req, res, next);

      // assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        type: 'https://httpstatuses.org/403',
        title: 'Only manager or admin can perform this operation',
        status: 403,
        detail: 'Only manager or admin can perform this operation'
      });
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
        type: 'https://httpstatuses.org/403',
        title: 'Only admin can perform this operation',
        status: 403,
        detail: 'Only admin can perform this operation'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireApprovedManager', () => {
    test('chiama next per un admin, senza consultare il db', async () => {
      // arrange
      const req = { user: { role: 'admin', id: 'admin-id' } };

      // act
      await requireApprovedManager(req, res, next);

      // assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(User.findById).not.toHaveBeenCalled();
    });

    test('chiama next per un customer, senza consultare il db', async () => {
      // arrange
      const req = { user: { role: 'customer', id: 'customer-id' } };

      // act
      await requireApprovedManager(req, res, next);

      // assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(User.findById).not.toHaveBeenCalled();
    });

    test('chiama next per un manager con managerStatus "approved"', async () => {
      // arrange
      const req = { user: { role: 'manager', id: 'manager-id' } };
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ managerStatus: 'approved' })
      });

      // act
      await requireApprovedManager(req, res, next);

      // assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    test('risponde con 403 per un manager con managerStatus "pending"', async () => {
      // arrange
      const req = { user: { role: 'manager', id: 'manager-id' } };
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ managerStatus: 'pending' })
      });

      // act
      await requireApprovedManager(req, res, next);

      // assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        type: 'https://httpstatuses.org/403',
        title: 'Manager account is pending approval',
        status: 403,
        detail: 'Manager account is pending approval'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('risponde con 403 se il manager non esiste più nel db', async () => {
      // arrange
      const req = { user: { role: 'manager', id: 'manager-id' } };
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      // act
      await requireApprovedManager(req, res, next);

      // assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    test('passa l\'errore a next se la query al db fallisce', async () => {
      // arrange
      const req = { user: { role: 'manager', id: 'manager-id' } };
      const dbError = new Error('connessione al db persa');
      User.findById.mockReturnValue({
        select: jest.fn().mockRejectedValue(dbError)
      });

      // act
      await requireApprovedManager(req, res, next);

      // assert
      expect(next).toHaveBeenCalledWith(dbError);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});

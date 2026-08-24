const paginationMiddleware = require('@middlewares/paginationMiddleware');

function createMockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('paginationMiddleware', () => {
  let res, next;

  beforeEach(() => {
    res = createMockRes();
    next = jest.fn();
  });

  test('usa page e limit di default quando la query string è vuota', () => {
    // arrange
    const req = { query: {} };

    // act
    paginationMiddleware(req, res, next);

    // assert
    expect(req.pagination).toEqual({ page: 1, limit: 20, skip: 0 });
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('calcola correttamente skip in base a page e limit', () => {
    // arrange
    const req = { query: { page: '3', limit: '10' } };

    // act
    paginationMiddleware(req, res, next);

    // assert
    expect(req.pagination).toEqual({ page: 3, limit: 10, skip: 20 });
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('risponde con 400 se page è minore di 1', () => {
    // arrange: uso un valore negativo, dato che con page='0' il fallback (0 || DEFAULT_PAGE) restituirebbe comunque 1
    const req = { query: { page: '-1' } };

    // act
    paginationMiddleware(req, res, next);

    // assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Page must be >= 1' });
    expect(next).not.toHaveBeenCalled();
  });

  test('risponde con 400 se limit supera MAX_LIMIT', () => {
    // arrange
    const req = { query: { limit: '101' } };

    // act
    paginationMiddleware(req, res, next);

    // assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Limit must be between 1 and 100' });
    expect(next).not.toHaveBeenCalled();
  });

  test('risponde con 400 se limit è minore di 1', () => {
    // arrange: uso un valore negativo, dato che con limit='0' il fallback (0 || DEFAULT_LIMIT) restituirebbe comunque 20
    const req = { query: { limit: '-5' } };

    // act
    paginationMiddleware(req, res, next);

    // assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});

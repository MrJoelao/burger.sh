const errorHandler = require('@middlewares/errorHandler');

function createMockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('errorHandler middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = createMockRes();
    next = jest.fn();
  });

  test('usa err.status come statusCode quando presente', () => {
    // arrange
    const err = new Error('errore custom');
    err.status = 418;

    // act
    errorHandler(err, req, res, next);

    // assert
    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { status: 418, message: 'errore custom' }
    });
  });

  test('usa err.statusCode come statusCode quando err.status non è presente', () => {
    // arrange
    const err = new Error('non trovato');
    err.statusCode = 404;

    // act
    errorHandler(err, req, res, next);

    // assert
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { status: 404, message: 'non trovato' }
    });
  });

  test('usa 500 come statusCode di default quando non è specificato', () => {
    // arrange
    const err = new Error('errore inatteso');

    // act
    errorHandler(err, req, res, next);

    // assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { status: 500, message: 'errore inatteso' }
    });
  });

  test('usa un messaggio di default quando err.message non è presente', () => {
    // arrange
    const err = {};

    // act
    errorHandler(err, req, res, next);

    // assert
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { status: 500, message: 'Internal Server Error' }
    });
  });
});

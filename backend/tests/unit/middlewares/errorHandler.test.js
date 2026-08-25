const errorHandler = require('@middlewares/errorHandler');

function createMockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('errorHandler middleware', () => {
  let req, res, next, consoleErrorSpy;

  beforeEach(() => {
    req = {};
    res = createMockRes();
    next = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
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
      message: 'errore custom'
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
      message: 'non trovato'
    });
  });

  test('usa 500 come statusCode di default quando non è specificato', () => {
    // arrange
    const err = new Error('errore inatteso');

    // act
    errorHandler(err, req, res, next);

    // assert
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('usa un messaggio di default quando err.message non è presente', () => {
    // arrange
    const err = {};

    // act
    errorHandler(err, req, res, next);

    // assert
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Internal Server Error'
    });
  });

  test('non espone err.message al client per errori con statusCode >= 500', () => {
    // arrange: un CastError di Mongoose, un errore di connessione o un bug
    // non gestito non devono mai rivelare dettagli interni al client
    const err = new Error('connection ECONNREFUSED 127.0.0.1:27017');
    err.statusCode = 500;

    // act
    errorHandler(err, req, res, next);

    // assert
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Internal Server Error'
    });
  });

  test('logga il dettaglio dell\'errore lato server per statusCode >= 500', () => {
    // arrange
    const err = new Error('dettaglio interno riservato ai log');
    err.statusCode = 502;

    // act
    errorHandler(err, req, res, next);

    // assert
    expect(consoleErrorSpy).toHaveBeenCalledWith(err);
  });

  test('non logga gli errori applicativi con statusCode < 500', () => {
    // arrange
    const err = new Error('Email already in use');
    err.statusCode = 409;

    // act
    errorHandler(err, req, res, next);

    // assert
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Email already in use'
    });
  });
});

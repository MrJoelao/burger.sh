const notFound = require('@middlewares/notFound');

describe('notFound middleware', () => {
  test('chiama next con un errore http-errors 404 con il messaggio corretto', () => {
    // arrange
    const req = { method: 'GET', originalUrl: '/rotte/inesistente' };
    const res = {};
    const next = jest.fn();

    // act
    notFound(req, res, next);

    // assert
    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(404);
    expect(err.message).toBe('Resource not found: GET /rotte/inesistente');
  });

  test('include metodo e url della richiesta nel messaggio d\'errore', () => {
    // arrange
    const req = { method: 'POST', originalUrl: '/orders/123' };
    const res = {};
    const next = jest.fn();

    // act
    notFound(req, res, next);

    // assert
    const err = next.mock.calls[0][0];
    expect(err.message).toContain('POST');
    expect(err.message).toContain('/orders/123');
  });
});

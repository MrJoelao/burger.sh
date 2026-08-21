const createError = require('http-errors');
const notFound = require('@middlewares/notFound');

describe('middlewares/notFound.js', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'GET',
      originalUrl: '/api/nonexistent'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next with 404 error', () => {
    notFound(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.status).toBe(404);
  });

  it('should include request method in error message', () => {
    notFound(req, res, next);

    const error = next.mock.calls[0][0];
    expect(error.message).toContain('GET');
  });

  it('should include request URL in error message', () => {
    notFound(req, res, next);

    const error = next.mock.calls[0][0];
    expect(error.message).toContain('/api/nonexistent');
  });

  it('should handle different HTTP methods', () => {
    const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];

    methods.forEach(method => {
      req.method = method;
      notFound(req, res, next);

      const error = next.mock.calls[next.mock.calls.length - 1][0];
      expect(error.message).toContain(method);
    });
  });

  it('should handle different URLs', () => {
    const urls = ['/api/users', '/api/orders/123', '/invalid/path'];

    urls.forEach(url => {
      req.originalUrl = url;
      notFound(req, res, next);

      const error = next.mock.calls[next.mock.calls.length - 1][0];
      expect(error.message).toContain(url);
    });
  });

  it('should use http-errors to create proper error object', () => {
    notFound(req, res, next);

    const error = next.mock.calls[0][0];
    expect(error.status || error.statusCode).toBe(404);
  });

  it('should format message as "Resource not found: METHOD URL"', () => {
    req.method = 'POST';
    req.originalUrl = '/api/test';

    notFound(req, res, next);

    const error = next.mock.calls[0][0];
    expect(error.message).toMatch(/Resource not found: POST \/api\/test/);
  });
});

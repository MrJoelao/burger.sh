const errorHandler = require('@middlewares/errorHandler');

describe('middlewares/errorHandler.js', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 500 with error message for generic error', () => {
    const error = new Error('Something went wrong');

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        status: 500,
        message: 'Something went wrong'
      }
    });
  });

  it('should use error.status if provided', () => {
    const error = new Error('Not found');
    error.status = 404;

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        status: 404,
        message: 'Not found'
      }
    });
  });

  it('should use error.statusCode as fallback', () => {
    const error = new Error('Conflict');
    error.statusCode = 409;

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        status: 409,
        message: 'Conflict'
      }
    });
  });

  it('should use default 500 when no status code is provided', () => {
    const error = new Error('Unknown error');

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        status: 500,
        message: 'Unknown error'
      }
    });
  });

  it('should use default message when error message is empty', () => {
    const error = new Error();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        status: 500,
        message: 'Internal Server Error'
      }
    });
  });

  it('should prioritize status over statusCode', () => {
    const error = new Error('Priority test');
    error.status = 401;
    error.statusCode = 500;

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});

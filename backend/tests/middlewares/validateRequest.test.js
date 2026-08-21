const Joi = require('joi');
const validate = require('@middlewares/validateRequest');

describe('middlewares/validateRequest.js', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('validate()', () => {
    it('should call next() and set req.validated when body is valid', () => {
      const schema = Joi.object({
        name: Joi.string().required()
      });

      req.body = { name: 'John' };

      const middleware = validate(schema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.validated).toEqual({ name: 'John' });
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should normalize data (strip unknown fields) when valid', () => {
      const schema = Joi.object({
        name: Joi.string().required()
      });

      req.body = { name: 'John', extraField: 'should be removed' };

      const middleware = validate(schema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.validated).toEqual({ name: 'John' });
      expect(req.validated.extraField).toBeUndefined();
    });

    it('should respond with 400 and errors array when body is invalid', () => {
      const schema = Joi.object({
        name: Joi.string().required()
      });

      req.body = {};

      const middleware = validate(schema);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledTimes(1);
      const response = res.json.mock.calls[0][0];
      expect(response.errors).toBeDefined();
      expect(Array.isArray(response.errors)).toBe(true);
      expect(response.errors.length).toBeGreaterThan(0);
      expect(next).not.toHaveBeenCalled();
    });

    it('should include validation message in errors array', () => {
      const schema = Joi.object({
        email: Joi.string().email().required()
      });

      req.body = { email: 'invalid-email' };

      const middleware = validate(schema);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      const response = res.json.mock.calls[0][0];
      expect(response.errors[0]).toContain('email');
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle multiple validation errors', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required()
      });

      req.body = {};

      const middleware = validate(schema);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      const response = res.json.mock.calls[0][0];
      expect(response.errors.length).toBeGreaterThanOrEqual(2);
      expect(next).not.toHaveBeenCalled();
    });
  });
});

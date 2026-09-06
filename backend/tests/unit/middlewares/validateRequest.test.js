const Joi = require('joi');
const validateRequest = require('@middlewares/validateRequest');

// schema di prova per testare il middleware in isolamento
const testSchema = Joi.object({
  name: Joi.string().required(),
  age: Joi.number().min(0).required()
});

function createMockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('validateRequest middleware', () => {
  let res, next;

  beforeEach(() => {
    res = createMockRes();
    next = jest.fn();
  });

  test('popola req.validated e chiama next quando il body è valido', () => {
    // arrange
    const req = { body: { name: 'Mario', age: 30 } };
    const middleware = validateRequest(testSchema);

    // act
    middleware(req, res, next);

    // assert
    expect(req.validated).toEqual({ name: 'Mario', age: 30 });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('risponde con 400 e un messaggio di errore quando il body non è valido', () => {
    // arrange
    const req = { body: { age: -5 } };
    const middleware = validateRequest(testSchema);

    // act
    middleware(req, res, next);

    // assert: stesso formato RFC 7807 usato da tutte le
    // altre risposte di errore dell'api (vedi utils/httpResponses.js)
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      type: 'https://httpstatuses.org/400',
      title: expect.any(String),
      status: 400,
      detail: expect.any(String)
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('rimuove i campi non definiti nello schema (stripUnknown)', () => {
    // arrange
    const req = { body: { name: 'Mario', age: 30, extra: 'campo non previsto' } };
    const middleware = validateRequest(testSchema);

    // act
    middleware(req, res, next);

    // assert
    expect(req.validated).toEqual({ name: 'Mario', age: 30 });
  });
});

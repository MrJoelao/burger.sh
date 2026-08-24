const {
  jsonOk,
  jsonError,
  paginate,
  handleAuth,
  notFound,
  badRequest
} = require('@utils/httpResponses');

// crea un mock di res con status/json concatenabili come nell'implementazione reale
function createMockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('httpResponses utils', () => {
  let res;

  beforeEach(() => {
    res = createMockRes();
  });

  describe('jsonOk', () => {
    test('risponde con statusCode e i dati passati', () => {
      // act
      jsonOk(res, 200, { id: 1 });

      // assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1 } });
    });

    test('non include il campo data se non viene passato', () => {
      // act
      jsonOk(res, 204);

      // assert
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('jsonError', () => {
    test('risponde con statusCode e messaggio di errore', () => {
      // act
      jsonError(res, 400, 'richiesta non valida');

      // assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'richiesta non valida' });
    });
  });

  describe('paginate', () => {
    test('calcola correttamente i metadati di paginazione', () => {
      // act
      const result = paginate(1, 10, 25, ['a', 'b']);

      // assert
      expect(result).toEqual({
        data: ['a', 'b'],
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3,
          hasNextPage: true,
          hasPrevPage: false
        }
      });
    });

    test('indica hasPrevPage true e hasNextPage false sull\'ultima pagina', () => {
      // act
      const result = paginate(3, 10, 25, ['x']);

      // assert
      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.hasPrevPage).toBe(true);
    });
  });

  describe('handleAuth', () => {
    test('traduce un authCheck negativo in una risposta di errore', () => {
      // arrange
      const authCheck = { authorized: false, statusCode: 403, message: 'non autorizzato' };

      // act
      handleAuth(res, authCheck);

      // assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'non autorizzato' });
    });
  });

  describe('notFound', () => {
    test('crea un errore con statusCode 404 e il messaggio passato', () => {
      // act
      const error = notFound('risorsa non trovata');

      // assert
      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('risorsa non trovata');
    });
  });

  describe('badRequest', () => {
    test('crea un errore con statusCode 400 e il messaggio passato', () => {
      // act
      const error = badRequest('input non valido');

      // assert
      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('input non valido');
    });
  });
});

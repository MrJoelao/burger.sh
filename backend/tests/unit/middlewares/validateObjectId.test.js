const validateObjectId = require('@middlewares/validateObjectId');

function createMockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('validateObjectId', () => {
  let res, next;

  beforeEach(() => {
    res = createMockRes();
    next = jest.fn();
  });

  test('chiama next quando il parametro è un ObjectId valido', () => {
    // arrange
    const req = { params: { id: '507f1f77bcf86cd799439011' } };

    // act
    validateObjectId('id')(req, res, next);

    // assert
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('risponde con 400 quando il parametro non è un ObjectId valido', () => {
    // arrange
    const req = { params: { id: 'abc' } };

    // act
    validateObjectId('id')(req, res, next);

    // assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      type: 'https://httpstatuses.org/400',
      title: 'Invalid id',
      status: 400,
      detail: 'Invalid id'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('valida più parametri contemporaneamente', () => {
    // arrange
    const req = { params: { id: '507f1f77bcf86cd799439011', restaurantId: 'abc' } };

    // act
    validateObjectId('id', 'restaurantId')(req, res, next);

    // assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      type: 'https://httpstatuses.org/400',
      title: 'Invalid restaurantId',
      status: 400,
      detail: 'Invalid restaurantId'
    });
    expect(next).not.toHaveBeenCalled();
  });
});

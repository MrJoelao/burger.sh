jest.mock('@models/User');
jest.mock('@models/Restaurant');
jest.mock('@utils/password');
jest.mock('@services/SeederService');

const User = require('@models/User');
const Restaurant = require('@models/Restaurant');
const { hashPassword } = require('@utils/password');
const { seedMeals } = require('@services/SeederService');
const { demoRestaurants } = require('../../../scripts/demoData');
const { seedDemoData } = require('../../../scripts/seedDemo');

describe('seedDemoData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hashPassword.mockResolvedValue('demo-hash');
    seedMeals.mockResolvedValue([]);
    User.findOneAndUpdate.mockImplementation(async (filter) => ({ _id: `${filter.email}-id` }));
    Restaurant.findOneAndUpdate.mockImplementation(async (filter) => ({ _id: `${filter.vatNumber}-id` }));
    User.updateOne.mockResolvedValue({});
  });

  test('loads meals and upserts each Citta Studi restaurant and manager', async () => {
    await expect(seedDemoData()).resolves.toBe(3);

    expect(seedMeals).toHaveBeenCalledTimes(1);
    expect(User.findOneAndUpdate).toHaveBeenCalledTimes(demoRestaurants.length);
    expect(Restaurant.findOneAndUpdate).toHaveBeenCalledTimes(demoRestaurants.length);
    expect(User.updateOne).toHaveBeenCalledTimes(demoRestaurants.length);
    expect(User.findOneAndUpdate.mock.calls.every(([, update, options]) =>
      update.role === 'manager' && options.upsert === true
    )).toBe(true);
    expect(User.findOneAndUpdate.mock.calls.some(([filter]) => filter.role === 'admin')).toBe(false);
    expect(Restaurant.findOneAndUpdate.mock.calls[0][0]).toEqual({
      vatNumber: 'IT09900010001',
    });
    expect(Restaurant.findOneAndUpdate.mock.calls[0][1].location).toEqual({
      lat: 45.4787,
      lng: 9.2272,
    });
  });
});

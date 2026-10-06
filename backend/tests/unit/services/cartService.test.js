jest.mock('@models/Order');
jest.mock('@models/Dish');

const Order = require('@models/Order');
const Dish = require('@models/Dish');
const { addItem } = require('@services/cartService');

const customerId = '507f1f77bcf86cd799439011';
const restaurantId = '507f1f77bcf86cd799439022';
const dishId = '507f1f77bcf86cd799439033';

/* addItem esercita anche mergeOrderItem (la somma delle quantity quando il
   piatto è già nel carrello): non è esportata a parte perché è un dettaglio
   implementativo di addItem, non un'operazione di dominio a sé stante */
describe('cartService', () => {
  describe('addItem', () => {
    beforeEach(() => {
      Order.findOne.mockReset();
      Dish.find.mockReset();
      Dish.find.mockResolvedValue([{ _id: dishId, price: 8.5, isCustom: false, restaurantId: null }]);
    });

    test('crea un nuovo carrello quando il cliente non ne ha uno attivo', async () => {
      Order.findOne.mockResolvedValue(null);
      const createdOrder = { populate: jest.fn().mockResolvedValue('populated') };
      Order.create.mockResolvedValue(createdOrder);

      const result = await addItem(customerId, { restaurantId, dishId, quantity: 2 });

      expect(result.error).toBeUndefined();
      expect(Order.create).toHaveBeenCalledWith(expect.objectContaining({
        customerId,
        restaurantId,
        status: 'draft',
        totalAmount: 17
      }));
    });

    test('somma la quantity se il piatto è già nel carrello, invece di duplicare la riga', async () => {
      const draft = {
        restaurantId,
        orderItems: [{ dishId, quantity: 1 }],
        save: jest.fn().mockResolvedValue(),
        populate: jest.fn().mockResolvedValue('populated')
      };
      Order.findOne.mockResolvedValue(draft);

      await addItem(customerId, { restaurantId, dishId, quantity: 2 });

      expect(draft.orderItems).toEqual([{ dishId, quantity: 3, unitPrice: 8.5 }]);
      expect(draft.totalAmount).toBe(25.5);
    });

    test('rifiuta con 409 un piatto di un\'altra filiale se esiste già un carrello aperto', async () => {
      const draft = { restaurantId: 'altra-filiale', orderItems: [] };
      Order.findOne.mockResolvedValue(draft);

      const result = await addItem(customerId, { restaurantId, dishId, quantity: 1 });

      expect(result).toEqual({
        error: 'You already have a draft order for another restaurant',
        statusCode: 409
      });
    });
  });
});

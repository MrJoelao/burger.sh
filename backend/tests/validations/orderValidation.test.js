const { createOrderSchema, updateOrderSchema, deliverySchema, orderItemSchema } = require('@validations/orderValidation');

describe('validations/orderValidation.js', () => {
  describe('orderItemSchema', () => {
    const validOrderItem = {
      dishId: '507f1f77bcf86cd799439011',
      quantity: 2,
      unitPrice: 12.99
    };

    it('should validate correct order item', () => {
      const { error, value } = orderItemSchema.validate(validOrderItem);

      expect(error).toBeUndefined();
      expect(value.quantity).toBe(2);
    });

    it('should fail when dishId is invalid ObjectId', () => {
      const invalidData = { ...validOrderItem, dishId: 'invalid-id' };

      const { error } = orderItemSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should fail when quantity is 0', () => {
      const invalidData = { ...validOrderItem, quantity: 0 };

      const { error } = orderItemSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should fail when unitPrice is negative', () => {
      const invalidData = { ...validOrderItem, unitPrice: -5 };

      const { error } = orderItemSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should allow zero unitPrice', () => {
      const validData = { ...validOrderItem, unitPrice: 0 };

      const { error } = orderItemSchema.validate(validData);

      expect(error).toBeUndefined();
    });
  });

  describe('deliverySchema', () => {
    const validDelivery = {
      address: '123 Main Street',
      distanceKm: 5.5,
      deliveryFee: 2.50
    };

    it('should validate correct delivery data', () => {
      const { error } = deliverySchema.validate(validDelivery);

      expect(error).toBeUndefined();
    });

    it('should fail when address is too short', () => {
      const invalidData = { ...validDelivery, address: 'A' };

      const { error } = deliverySchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should trim address whitespace', () => {
      const dataWithWhitespace = { ...validDelivery, address: '  Main Street  ' };

      const { error, value } = deliverySchema.validate(dataWithWhitespace);

      expect(error).toBeUndefined();
      expect(value.address).toBe('Main Street');
    });

    it('should allow missing distanceKm', () => {
      const { address, deliveryFee } = validDelivery;

      const { error } = deliverySchema.validate({ address, deliveryFee });

      expect(error).toBeUndefined();
    });

    it('should fail when distanceKm is negative', () => {
      const invalidData = { ...validDelivery, distanceKm: -2 };

      const { error } = deliverySchema.validate(invalidData);

      expect(error).toBeDefined();
    });
  });

  describe('createOrderSchema', () => {
    const validOrder = {
      customerId: '507f1f77bcf86cd799439011',
      restaurantId: '507f1f77bcf86cd799439012',
      orderItems: [
        { dishId: '507f1f77bcf86cd799439013', quantity: 1, unitPrice: 10 }
      ],
      mode: 'pickup',
      totalAmount: 10,
      orderCode: 'ORDER123'
    };

    it('should validate correct pickup order', () => {
      const { error } = createOrderSchema.validate(validOrder);

      expect(error).toBeUndefined();
    });

    it('should require delivery when mode is delivery', () => {
      const deliveryOrder = {
        ...validOrder,
        mode: 'delivery',
        delivery: {
          address: '123 Main St',
          deliveryFee: 5
        }
      };

      const { error } = createOrderSchema.validate(deliveryOrder);

      expect(error).toBeUndefined();
    });

    it('should fail when delivery is missing for delivery mode', () => {
      const invalidOrder = {
        ...validOrder,
        mode: 'delivery'
      };

      const { error } = createOrderSchema.validate(invalidOrder);

      expect(error).toBeDefined();
    });

    it('should forbid delivery for pickup mode', () => {
      const invalidOrder = {
        ...validOrder,
        mode: 'pickup',
        delivery: { address: '123 Main St', deliveryFee: 5 }
      };

      const { error } = createOrderSchema.validate(invalidOrder);

      expect(error).toBeDefined();
    });

    it('should fail when orderItems is empty', () => {
      const invalidOrder = { ...validOrder, orderItems: [] };

      const { error } = createOrderSchema.validate(invalidOrder);

      expect(error).toBeDefined();
    });

    it('should fail when customerId is invalid ObjectId', () => {
      const invalidOrder = { ...validOrder, customerId: 'invalid-id' };

      const { error } = createOrderSchema.validate(invalidOrder);

      expect(error).toBeDefined();
    });

    it('should fail when status is not valid', () => {
      const invalidOrder = { ...validOrder, status: 'invalid_status' };

      const { error } = createOrderSchema.validate(invalidOrder);

      expect(error).toBeDefined();
    });

    it('should accept valid status values', () => {
      const validStatuses = ['ordered', 'preparing', 'ready', 'on_delivery', 'delivered'];

      validStatuses.forEach(status => {
        const order = { ...validOrder, status };
        const { error } = createOrderSchema.validate(order);
        expect(error).toBeUndefined();
      });
    });

    it('should fail when totalAmount is negative', () => {
      const invalidOrder = { ...validOrder, totalAmount: -10 };

      const { error } = createOrderSchema.validate(invalidOrder);

      expect(error).toBeDefined();
    });
  });

  describe('updateOrderSchema', () => {
    it('should validate empty object', () => {
      const { error } = updateOrderSchema.validate({});

      expect(error).toBeUndefined();
    });

    it('should allow partial status update', () => {
      const { error } = updateOrderSchema.validate({ status: 'preparing' });

      expect(error).toBeUndefined();
    });

    it('should allow partial delivery update', () => {
      const updateData = {
        mode: 'delivery',
        delivery: {
          address: '456 Oak St'
        }
      };

      const { error } = updateOrderSchema.validate(updateData);

      expect(error).toBeUndefined();
    });
  });
});

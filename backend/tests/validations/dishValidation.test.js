const { createDishSchema, updateDishSchema } = require('@validations/dishValidation');

describe('validations/dishValidation.js', () => {
  describe('createDishSchema', () => {
    const validDishData = {
      name: 'Burger',
      type: 'Fast Food',
      price: 12.99,
      photoUrl: 'https://example.com/burger.jpg',
      ingredientIds: ['507f1f77bcf86cd799439011'],
      isCustom: false
    };

    it('should validate correct dish data', () => {
      const { error, value } = createDishSchema.validate(validDishData);

      expect(error).toBeUndefined();
      expect(value.price).toBe(12.99);
    });

    it('should fail when name is missing', () => {
      const invalidData = { ...validDishData };
      delete invalidData.name;

      const { error } = createDishSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should fail when price is negative', () => {
      const invalidData = { ...validDishData, price: -5 };

      const { error } = createDishSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should fail when price is zero', () => {
      const invalidData = { ...validDishData, price: 0 };

      const { error } = createDishSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should fail when photoUrl is not a valid URI', () => {
      const invalidData = { ...validDishData, photoUrl: 'not-a-url' };

      const { error } = createDishSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should allow empty photoUrl string', () => {
      const dataWithEmptyPhoto = { ...validDishData, photoUrl: '' };

      const { error } = createDishSchema.validate(dataWithEmptyPhoto);

      expect(error).toBeUndefined();
    });

    it('should fail when ingredientIds is not valid ObjectId format', () => {
      const invalidData = { ...validDishData, ingredientIds: ['invalid-id'] };

      const { error } = createDishSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should require restaurantId when isCustom is true', () => {
      const customDishData = { ...validDishData, isCustom: true };
      delete customDishData.restaurantId;

      const { error } = createDishSchema.validate(customDishData);

      expect(error).toBeDefined();
    });

    it('should not require restaurantId when isCustom is false', () => {
      const standardDishData = { ...validDishData, isCustom: false, restaurantId: null };

      const { error } = createDishSchema.validate(standardDishData);

      expect(error).toBeUndefined();
    });

    it('should fail when type is less than 2 characters', () => {
      const invalidData = { ...validDishData, type: 'A' };

      const { error } = createDishSchema.validate(invalidData);

      expect(error).toBeDefined();
    });
  });

  describe('updateDishSchema', () => {
    const partialDishData = {
      name: 'Updated Burger'
    };

    it('should validate with only name field', () => {
      const { error, value } = updateDishSchema.validate(partialDishData);

      expect(error).toBeUndefined();
      expect(value.name).toBe('Updated Burger');
    });

    it('should validate empty object', () => {
      const { error } = updateDishSchema.validate({});

      expect(error).toBeUndefined();
    });

    it('should allow partial updates', () => {
      const partialData = {
        price: 15.99,
        photoUrl: 'https://example.com/new-burger.jpg'
      };

      const { error, value } = updateDishSchema.validate(partialData);

      expect(error).toBeUndefined();
      expect(value.price).toBe(15.99);
    });

    it('should fail when price is negative', () => {
      const invalidData = { price: -10 };

      const { error } = updateDishSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it('should allow valid restaurantId in ObjectId format', () => {
      const validData = { restaurantId: '507f1f77bcf86cd799439011' };

      const { error } = updateDishSchema.validate(validData);

      expect(error).toBeUndefined();
    });
  });
});

const generateOrderCode = require('@utils/generateOrderCode');

describe('utils/generateOrderCode.js', () => {
  it('should return a string token', () => {
    const code = generateOrderCode();
    expect(typeof code).toBe('string');
  });

  it('should generate code with FF prefix', () => {
    const code = generateOrderCode();
    expect(code).toMatch(/^FF-/);
  });

  it('should generate code with 6 random alphanumeric characters', () => {
    const code = generateOrderCode();
    const match = code.match(/^FF-([A-Z0-9]{6})$/);
    expect(match).not.toBeNull();
  });

  it('should generate different codes on each call', () => {
    const code1 = generateOrderCode();
    const code2 = generateOrderCode();
    const code3 = generateOrderCode();

    expect(code1).not.toBe(code2);
    expect(code2).not.toBe(code3);
    expect(code1).not.toBe(code3);
  });

  it('should only use uppercase letters and digits', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateOrderCode();
      expect(code).toMatch(/^FF-[A-Z0-9]{6}$/);
    }
  });
});

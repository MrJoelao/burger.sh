const generateOrderCode = require('@utils/generateOrderCode');

describe('generateOrderCode', () => {
  test('genera un codice nel formato FF-XXXXXX', () => {
    // act
    const code = generateOrderCode();

    // assert
    expect(code).toMatch(/^FF-[A-Z0-9]{6}$/);
  });

  test('genera codici statisticamente unici su più chiamate', () => {
    // arrange
    const iterations = 1000;

    // act
    const codes = new Set();
    for (let i = 0; i < iterations; i++) {
      codes.add(generateOrderCode());
    }

    // assert: con un alfabeto di 36 caratteri su 6 posizioni le collisioni su 1000 tentativi devono essere rarissime
    expect(codes.size).toBeGreaterThan(iterations * 0.99);
  });
});

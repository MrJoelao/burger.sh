const {
  escapeRegex,
  containsFilter,
  parseNonNegativeNumber,
  combineFilters
} = require('@utils/searchFilters');

describe('searchFilters utils', () => {
  describe('escapeRegex', () => {
    test('esegue l\'escape dei caratteri speciali di una regex', () => {
      // act
      const result = escapeRegex('a.b*c?');

      // assert
      expect(result).toBe('a\\.b\\*c\\?');
    });
  });

  describe('containsFilter', () => {
    test('restituisce undefined se il valore non è passato', () => {
      expect(containsFilter(undefined)).toBeUndefined();
      expect(containsFilter(null)).toBeUndefined();
      expect(containsFilter('')).toBeUndefined();
    });

    test('costruisce una regex case-insensitive che trova un match parziale', () => {
      // act
      const filter = containsFilter('burg');

      // assert
      expect(filter).toBeInstanceOf(RegExp);
      expect(filter.test('Burger House')).toBe(true);
      expect(filter.test('Pizzeria')).toBe(false);
    });

    test('esegue l\'escape dei caratteri speciali contenuti nel valore', () => {
      // act
      const filter = containsFilter('a.b');

      // assert
      expect(filter.test('axb')).toBe(false);
      expect(filter.test('a.b')).toBe(true);
    });
  });

  describe('parseNonNegativeNumber', () => {
    test('restituisce undefined se il valore non è passato', () => {
      expect(parseNonNegativeNumber(undefined, 'minPrice')).toBeUndefined();
    });

    test('converte una stringa numerica valida in un numero', () => {
      expect(parseNonNegativeNumber('5.5', 'minPrice')).toBe(5.5);
    });

    test('lancia un errore 400 se il valore non è un numero', () => {
      expect(() => parseNonNegativeNumber('abc', 'minPrice')).toThrow('minPrice must be a non-negative number');
    });

    test('lancia un errore 400 se il valore è negativo', () => {
      expect(() => parseNonNegativeNumber('-1', 'maxPrice')).toThrow('maxPrice must be a non-negative number');
    });
  });

  describe('combineFilters', () => {
    test('restituisce un filtro vuoto se non ci sono condizioni', () => {
      expect(combineFilters([])).toEqual({});
    });

    test('restituisce l\'unica condizione così com\'è, senza avvolgerla in $and', () => {
      const condition = { name: /burg/i };

      expect(combineFilters([condition])).toBe(condition);
    });

    test('unisce più condizioni con $and', () => {
      const conditions = [{ name: /burg/i }, { city: /milano/i }];

      expect(combineFilters(conditions)).toEqual({ $and: conditions });
    });
  });
});

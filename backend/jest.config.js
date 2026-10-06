module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/test.setup.js'],
  verbose: true,
  collectCoverage: false,
  testTimeout: 10000,
  clearMocks: true,
  resetMocks: false,
  restoreMocks: false,
  // mappa esplicita dei moduli - risolve dalla root
  moduleNameMapper: {
    '^@utils/(.*)$': '<rootDir>/utils/$1',
    '^@middlewares/(.*)$': '<rootDir>/middlewares/$1',
    '^@controllers/(.*)$': '<rootDir>/controllers/$1',
    '^@models/(.*)$': '<rootDir>/models/$1',
    '^@validations/(.*)$': '<rootDir>/validations/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@routes/(.*)$': '<rootDir>/routes/$1',
    '^@services/(.*)$': '<rootDir>/services/$1'
  }
};

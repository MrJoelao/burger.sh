const mongoose = require('mongoose');

jest.mock('mongoose');

const connectDB = require('@config/db');

describe('connectDB', () => {
  const originalMongodbUri = process.env.MONGODB_URI;
  const originalMongoUri = process.env.MONGO_URI;
  let processExitSpy;
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    delete process.env.MONGODB_URI;
    delete process.env.MONGO_URI;
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.MONGODB_URI = originalMongodbUri;
    process.env.MONGO_URI = originalMongoUri;
    processExitSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  test('lancia un errore se MONGODB_URI e MONGO_URI non sono definite', async () => {
    // act & assert
    await expect(connectDB()).rejects.toThrow('MONGODB_URI non definita');
    expect(mongoose.connect).not.toHaveBeenCalled();
  });

  test('chiama mongoose.connect con l\'uri corretta in caso di successo', async () => {
    // arrange
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';
    mongoose.connect.mockResolvedValue();

    // act
    await connectDB();

    // assert
    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/test-db');
    expect(processExitSpy).not.toHaveBeenCalled();
  });

  test('usa MONGO_URI come fallback se MONGODB_URI non è definita', async () => {
    // arrange
    process.env.MONGO_URI = 'mongodb://localhost:27017/fallback-db';
    mongoose.connect.mockResolvedValue();

    // act
    await connectDB();

    // assert
    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/fallback-db');
  });

  test('logga l\'errore e chiama process.exit(1) se la connessione fallisce', async () => {
    // arrange
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';
    const connectionError = new Error('connessione rifiutata');
    mongoose.connect.mockRejectedValue(connectionError);

    // act
    await connectDB();

    // assert
    expect(consoleErrorSpy).toHaveBeenCalledWith('MongoDB connection error:', 'connessione rifiutata');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});

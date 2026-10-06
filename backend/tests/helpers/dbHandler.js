/* helper condiviso dai test di integrazione: avvia un mongodb in memoria
   (mongodb-memory-server) e gestisce la connessione mongoose così i test
   possono leggere/scrivere su un database reale senza toccare quello di
   produzione. ogni file di test che lo usa ha la propria istanza, isolata
   dagli altri file (che jest esegue in worker separati). */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// avvia il server in memoria e connette mongoose, va chiamato in un beforeAll
async function connect() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}

// svuota tutte le collezioni, va chiamato in un afterEach/beforeEach per isolare i test tra loro
async function clearDatabase() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

// chiude la connessione e ferma il server in memoria, va chiamato in un afterAll
async function closeDatabase() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
}

module.exports = {
  connect,
  clearDatabase,
  closeDatabase
};

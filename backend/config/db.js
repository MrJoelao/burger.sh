const mongoose = require("mongoose");

/*
  MongoDB URI resolution strategy:
  1. If MONGODB_URI is set in .env, use it (production/cloud)
  2. If NODE_ENV=development and MONGODB_URI is not set, use localhost
  3. Otherwise throw an error
*/

async function connectDB() {
  // Try to get URI from environment
  let uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  // If no URI and we're in development, default to local MongoDB
  if (!uri && process.env.NODE_ENV === "development") {
    uri = "mongodb://localhost:27017/burger";
    console.log("[db] Using local MongoDB: mongodb://localhost:27017/burger");
  }

  if (!uri) {
    throw new Error(
      "Errore: MONGODB_URI non definita nel file .env.\n" +
        "Copia .env.example in .env e inserisci la tua MongoDB URI.\n" +
        "Per usare MongoDB locale in dev, avvia con: NODE_ENV=development npm run dev"
    );
  }

  try {
    await mongoose.connect(uri);
    const env = process.env.NODE_ENV === "development" ? "DEV" : "PROD";
    console.log(`[db] Connected to MongoDB (${env})`);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
}

module.exports = connectDB;

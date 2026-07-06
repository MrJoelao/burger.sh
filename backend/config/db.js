const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI; //prendo url con la password dal .env

  if (!uri) {
    throw new Error("Errore: MONGO_URI, non definita nel file .env");
  }
  try {
    await mongoose.connect(uri);
    console.log("connesione al db riuscita");
  } catch (error) {
    console.error("Errore di connessione a MongoDB:", error.message);
    process.exit(1);
  }
}

module.exports = connectDB; //esporta la funzione in modo che altri file possano usare connectDB esternamente

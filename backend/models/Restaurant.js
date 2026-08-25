const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  // entità completa del ristorante
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true, // indirizzo del ristorante
    },
    city: {
      type: String,
      required: true,
      trim: true, // città in cui si trova la filiale
    },
    phone: {
      type: String,
      required: true,
      trim: true, // numero di telefono del ristorante
    },
    vatNumber: {
      type: String,
      required: true,
      trim: true, // partita iva della filiale
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // riferimento al manager proprietario della filiale
    },
    location: {
      /* coordinate geocodificate da address/city tramite le API di
         OpenStreetMap (vedi deliveryService.ensureRestaurantLocation):
         calcolate al bisogno, alla prima richiesta di consegna per questa
         filiale, e riusate per tutte le successive senza richiamare il
         servizio esterno */
      lat: {
        type: Number,
        min: -90,
        max: 90,
      },
      lng: {
        type: Number,
        min: -180,
        max: 180,
      },
    },
  },
  {
    timestamps: true, // mongodb gestirà in automatico la data e ora di creazione/modifica
  },
);

module.exports = mongoose.model("Restaurant", restaurantSchema);

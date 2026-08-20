const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  // sottodocumento embedded che rappresenta una riga dell'ordine
  {
    dishId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dish", // riferimento al piatto ordinato
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1, // almeno un'unità per ogni riga ordine
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0, // prezzo unitario al momento dell'acquisto (snapshot, non dipende dai cambiamenti futuri del piatto)
    },
  },
  { _id: false }, // evita che mongodb aggiunga un id inutile alle righe ordine
);

const deliverySchema = new mongoose.Schema(
  // sottodocumento opzionale, presente solo per ordini a domicilio
  {
    address: {
      type: String,
      required: true,
      trim: true, // indirizzo di consegna inserito dal cliente
    },
    distanceKm: {
      type: Number,
      min: 0, // distanza calcolata tramite le API di OpenStreetMap
    },
    deliveryFee: {
      type: Number,
      min: 0, // costo di consegna calcolato in base alla distanza
    },
  },
  { _id: false }, // evita che mongodb aggiunga un id innecesario
);

const orderSchema = new mongoose.Schema(
  // entità completa dell'ordine, rappresenta anche il carrello in stato "bozza"
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // riferimento al cliente che ha effettuato l'ordine
      required: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant", // riferimento al ristorante a cui appartiene l'ordine
      required: true,
    },
    orderItems: [orderItemSchema], // righe dell'ordine embedded, lette e aggiornate insieme all'ordine
    status: {
      type: String,
      enum: ["ordered", "preparing", "ready", "on_delivery", "delivered"],
      required: true,
      default: "ordered",
    },
    mode: {
      type: String,
      enum: ["pickup", "delivery"], // modalità di completamento dell'ordine
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0, // importo totale dell'ordine
    },
    orderCode: {
      type: String,
      required: true,
      unique: true,
      trim: true, // codice alfanumerico univoco mostrato al cliente (es. "FF-A1B2C3")
    },
    delivery: {
      type: deliverySchema,
      default: null, // assente (non null) quando mode è "ritiro", presente solo per ordini a domicilio
    },
  },
  {
    timestamps: true, // mongodb gestirà in automatico la data e ora di creazione/modifica dell'ordine
  },
);

module.exports = mongoose.model("Order", orderSchema);

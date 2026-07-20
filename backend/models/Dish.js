const mongoose = require("mongoose");

const dishSchema = new mongoose.Schema(
  // entità completa del piatto, sia standard che personalizzato
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      trim: true, // tipologia del piatto (es. "burger", "drink", "side")
    },
    price: {
      type: Number,
      required: true,
      min: 0, // il prezzo non può essere negativo
    },
    photoUrl: {
      type: String,
      trim: true, // url della foto illustrativa del piatto
    },
    ingredientIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ingredient", // riferimento agli ingredienti della collezione ingredients
      },
    ],
    isCustom: {
      type: Boolean,
      default: false, // true solo per piatti personalizzati di uno specifico ristorante
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null, // null per piatti standard, popolato solo se isCustom è true
    },
  },
  {
    timestamps: true, // mongodb gestirà in automatico la data e ora di creazione/modifica
  },
);

module.exports = mongoose.model("Dish", dishSchema);

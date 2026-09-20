const mongoose = require("mongoose");

const ingredientSchema = new mongoose.Schema(
  // entità dell'ingrediente, condiviso tra più piatti
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    allergens: [
      {
        type: String,
        trim: true, // lista degli allergeni associati all'ingrediente (es. "lattosio", "glutine")
      },
    ],
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true, // mongodb gestirà in automatico la data e ora di creazione/modifica
  },
);

module.exports = mongoose.model("Ingredient", ingredientSchema);

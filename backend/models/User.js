const mongoose = require("mongoose");
const { ALLOWED_PREFERENCES } = require("../constants/preferences");

const addressSchema = new mongoose.Schema(
  // entità dell'indirizzo
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    zip: { type: String, trim: true },
  },
  { _id: false }, // evita che mongodb aggiunga un id innecesario
);

const userSchema = new mongoose.Schema(
  // entità completa di user
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    surname: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["customer", "manager", "admin"], // il suo ruolo, può variare tra cliente, manager e admin
      required: true,
    },
    address: addressSchema,
    managerStatus: {
      type: String,
      /* "rejected" è transitorio: adminController.updateUser lo traduce subito
         in un declassamento a "customer" con managerStatus rimosso, così
         nessun utente resta bloccato in uno stato manager rifiutato */
      enum: ["pending", "approved", "rejected"],
    },
    preferences: [{ type: String, trim: true, enum: ALLOWED_PREFERENCES }],
  },
  {
    timestamps: true, // mongodb gestirà in automatico la data e ora di quando un utente verrà aggiunto/modificato
  },
);

module.exports = mongoose.model("User", userSchema);

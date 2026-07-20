const mongoose = require("mongoose");

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
      enum: ["pending", "approved"], // un manager deve essere "approvato" dall'admin
    },
  },
  {
    timestamps: true, // mongodb gestirà in automatico la data e ora di quando un utente verrà aggiunto/modificato
  },
);

module.exports = mongoose.model("User", userSchema);

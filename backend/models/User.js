const mongoose = require("mongoose");
const { ALLOWED_PREFERENCES } = require("../constants/preferences");

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    zip: { type: String, trim: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    surname: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["customer", "manager", "admin"],
      required: true,
    },
    address: addressSchema,
    managerStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
    },
    preferences: [{ type: String, trim: true, enum: ALLOWED_PREFERENCES }],
    mustChangePassword: {
      type: Boolean,
      default: false,
      description:
        "se true, l'utente deve cambiare password al prossimo login",
    },
    setupCompleted: {
      type: Boolean,
      default: false,
      description:
        "flag usato dal sistema per tracciare se il setup iniziale è stato eseguito",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

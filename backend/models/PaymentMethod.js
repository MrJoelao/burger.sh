const mongoose = require("mongoose");

const paymentMethodSchema = new mongoose.Schema(
  // entità del metodo di pagamento associato a un cliente
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // riferimento al cliente proprietario del metodo di pagamento
      required: true,
    },
    type: {
      type: String,
      enum: ["carta", "contanti"], // tipologia del metodo di pagamento
      required: true,
    },
    label: {
      type: String,
      trim: true, // nome descrittivo assegnato dal cliente (es. "Carta principale")
    },
    details: {
      type: String,
      trim: true, // ultime 4 cifre della carta o identificativo del metodo (non si memorizzano dati sensibili completi)
    },
  },
  {
    timestamps: true, // mongodb gestirà in automatico la data e ora di aggiunta/modifica del metodo
  },
);

module.exports = mongoose.model("PaymentMethod", paymentMethodSchema);

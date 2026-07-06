describes the main domain entities (User, Restaurant, Dish, Order, Delivery, …) and their key fields.
It serves as a bridge between the textual requirements and the actual database schema.

┌─────────────────────────────────────────────────┐
│                  UTENTE                         │
│─────────────────────────────────────────────────│
│ nome                                            │
│ cognome                                         │
│ email                                           │
│ indirizzo                                       │
│ ruolo   ← [domanda 1]                           │
│ ???     ← quali altri attributi hai nei req?    │
└──────────────────┬──────────────────────────────┘
                   │
      ┌────────────┴────────────┐
      │                         │
      ▼                         ▼
┌──────────┐             ┌───────────┐
│ CLIENTE  │             │  MANAGER  │
│──────────│             │───────────│
│ ???      │             │ ???       │
└──────────┘             └───────────┘

[domanda 2]: UTENTE è una superclasse con CLIENTE e MANAGER come sottoclassi?
             Oppure è una sola entità con un attributo "ruolo"?
             Pensa a quanti attributi sono in comune e quanti sono specifici.


┌─────────────────────────────────────────────────┐
│                 RISTORANTE                      │
│─────────────────────────────────────────────────│
│ nome                                            │
│ indirizzo                                       │
│ ???     ← quali altri attributi hai nei req?    │
└─────────────────────────────────────────────────┘

[domanda 3]: Un MANAGER può gestire più ristoranti, o sempre uno solo?
             Guarda cosa dicono i requisiti alla sezione 4.
             Come scrivi la cardinalità di questa associazione?


┌─────────────────────────────────────────────────┐
│                   PIATTO                        │
│─────────────────────────────────────────────────│
│ nome                                            │
│ tipologia                                       │
│ prezzo                                          │
│ ???                                             │
└─────────────────────────────────────────────────┘

[domanda 4]: Esiste una distinzione tra "piatto comune della catena" 
             e "piatto personalizzato del singolo ristorante"?
             Sono la stessa entità con un attributo, o due entità distinte?
             Hai letto la sezione 4 (meal.json)?


┌─────────────────────────────────────────────────┐
│                   ORDINE                        │
│─────────────────────────────────────────────────│
│ codiceAlfanumerico                              │
│ stato  ← [domanda 5]                            │
│ dataOra                                         │
│ ???                                             │
└─────────────────────────────────────────────────┘

[domanda 5]: Lo "stato" dell'ordine (ordinato, in preparazione, ...) 
             è un attributo dell'entità Ordine, oppure modelli una 
             StoricoStati separata? Cosa ti conviene nel tuo dominio?

[domanda 6]: Il CARRELLO è un'entità a sé o è parte dell'Ordine?
             Esiste nel dominio reale una differenza tra 
             "carrello in fase di composizione" e "ordine confermato"?


┌─────────────────────────────────────────────────┐
│               RIGA ORDINE (?)                   │
│─────────────────────────────────────────────────│
│ quantità                                        │
│ prezzoUnitario                                  │
└─────────────────────────────────────────────────┘

[domanda 7]: Quando un cliente mette un piatto nel carrello,
             questa è solo un'associazione ORDINE–PIATTO con attributi,
             oppure merita una propria entità "RigaOrdine"?
             (Hint: se l'associazione ha attributi propri → entità)


┌─────────────────────────────────────────────────┐
│                  CONSEGNA                       │
│─────────────────────────────────────────────────│
│ indirizzoDestinazione                           │
│ distanzaKm                                      │
│ costoConsegna                                   │
│ ???                                             │
└─────────────────────────────────────────────────┘

[domanda 8]: La CONSEGNA è un'entità separata oppure degli attributi 
             aggiuntivi dentro ORDINE?
             Pensa: esistono ordini senza consegna (ritiro in sede).
             Come modelli questa opzionalità nel dominio?


┌─────────────────────────────────────────────────┐
│            METODO DI PAGAMENTO                  │
│─────────────────────────────────────────────────│
│ ???                                             │
└─────────────────────────────────────────────────┘

[domanda 9]: Quali attributi ha un metodo di pagamento?
             È un'entità autonoma collegata al Cliente, 
             oppure solo un attributo dell'Ordine?
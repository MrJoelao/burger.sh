# Test del backend

Questa cartella contiene la suite di test del backend, scritta con Jest, Supertest e `mongodb-memory-server`.

## Eseguire tutti i test

Dalla cartella `backend`, esegui:

```
npm test
```

Il comando lancia Jest con la configurazione in `backend/jest.config.js`, che cerca ogni file che corrisponde a `tests/**/*.test.js`.

## Eseguire un sottoinsieme di test

Per eseguire solo i test unitari:

```
npx jest tests/unit
```

Per eseguire solo i test di integrazione:

```
npx jest tests/integration
```

Per eseguire un singolo file, passa il suo percorso:

```
npx jest tests/unit/utils/jwt.test.js
```

Per eseguire solo i test il cui nome corrisponde a una stringa o a un'espressione regolare, usa `-t`:

```
npx jest -t "isAdmin"
```

## Eseguire i test in watch mode

Durante lo sviluppo, per rieseguire automaticamente i test a ogni modifica:

```
npm run test:watch
```

## Generare il report di copertura

```
npm run test:coverage
```

Il report finisce in `backend/coverage/`. Apri `backend/coverage/lcov-report/index.html` in un browser per vedere il dettaglio riga per riga.

## Struttura della cartella

```
tests/
├── test.setup.js          # imposta JWT_SECRET e NODE_ENV prima di ogni file di test
├── helpers/
│   ├── dbHandler.js        # avvia e ferma il MongoDB in memoria per i test di integrazione
│   └── factories.js        # funzioni per creare rapidamente utenti, ristoranti, piatti e ordini validi
├── unit/                   # test isolati, con mock delle dipendenze esterne (jsonwebtoken, mongoose, ecc.)
│   ├── utils/
│   ├── validations/
│   ├── middlewares/
│   └── config/
└── integration/            # test contro un database MongoDB in memoria reale, tramite Supertest
    ├── models/
    └── routes/
```

I test unitari in `tests/unit/` non toccano il database: mockano ogni dipendenza esterna (`jsonwebtoken`, `mongoose`, `process.exit`) e verificano la logica di una singola funzione o di un singolo middleware.

I test di integrazione in `tests/integration/` avviano un'istanza di MongoDB in memoria tramite `tests/helpers/dbHandler.js` e chiamano l'app Express reale con Supertest, per verificare modelli Mongoose e rotte API end-to-end (incluse le regole di autorizzazione per ruolo).

## Nessun database esterno richiesto

I test di integrazione non si collegano al database di produzione indicato in `.env`. `mongodb-memory-server` scarica e avvia un binario MongoDB isolato a ogni esecuzione. Non serve un database Mongo installato o in esecuzione sulla macchina, ma la prima esecuzione richiede una connessione a Internet per scaricare il binario.

## Scrivere un nuovo test

Per aggiungere un test unitario, crea un file `*.test.js` nella sottocartella di `tests/unit/` corrispondente al modulo che vuoi testare (`utils/`, `validations/`, `middlewares/` o `config/`). Mocka ogni dipendenza esterna con `jest.mock(...)`.

Per aggiungere un test di integrazione, crea un file `*.test.js` in `tests/integration/models/` o `tests/integration/routes/`. Nel file, chiama `dbHandler.connect()` in un `beforeAll`, `dbHandler.clearDatabase()` in un `afterEach` e `dbHandler.closeDatabase()` in un `afterAll`. Usa le funzioni di `tests/helpers/factories.js` per creare i dati di prova, ed evita di riusare dati tra test diversi.

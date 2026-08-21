
Avatar del profilo
GitHub

	
	
	
	
	
	
	
	
	

# Test Suite - FastFood Backend

Questa directory contiene i test unitari per il backend del progetto FastFood.

## Struttura

```
tests/
├── utils/
│   ├── password.test.js      # Test per hash/compare password (bcrypt)
│   └── jwt.test.js           # Test per sign/verify JWT
├── middlewares/
│   ├── validateRequest.test.js  # Test per validazione richieste con Joi
│   └── authMiddleware.test.js   # Test per autenticazione JWT
├── controllers/
│   └── authController.test.js   # Test per register/login
├── jest.config.js            # Configurazione Jest
└── README.md                 # Questo file
```

## Installazione dipendenze

```bash
npm install --save-dev jest @types/jest
```

## Esecuzione test

```bash
# Esegui tutti i test
npm test

# Esegui con coverage
npm test -- --coverage

# Esegui in watch mode durante lo sviluppo
npm test -- --watch

# Esegui un singolo file di test
npm test -- tests/utils/password.test.js

# Esegui test con pattern nel nome
npm test -- -t "should return 401"
```

## Best Practice Seguite

- **AAA Pattern**: Ogni test segue Arrange-Act-Assert
- **Mock ai confini**: Solo I/O (DB, JWT, bcrypt) sono mockati
- **Test isolati**: Ogni test è indipendente, mock resettati in `beforeEach`
- **Nomi descrittivi**: I test specificano il comportamento atteso
- **No DB reale**: Tutti i test sono unit test, nessuna connessione a MongoDB

## Coverage Target

La configurazione Jest richiede:
- Statements: 80%
- Branches: 70%
- Functions: 80%
- Lines: 80%

## Aggiungere nuovi test

1. Crea un file `.test.js` nella directory corrispondente a quella del modulo
2. Mocka tutte le dipendenze esterne con `jest.mock()`
3. Usa `beforeEach` per resettare i mock
4. Segui il pattern AAA in ogni test
5. Usa nomi descrittivi: `it('should return 401 when email does not exist')`

## Esempio di test

```javascript
describe('moduleName', () => {
  let mockDependency;

  beforeEach(() => {
    mockDependency = jest.fn();
    jest.clearAllMocks();
  });

  it('should do something when condition is met', () => {
    // Arrange
    mockDependency.mockReturnValue('expected');

    // Act
    const result = functionUnderTest();

    // Assert
    expect(result).toBe('expected');
  });
});
```

## Troubleshooting

### "Cannot find module"
Assicurati che i percorsi nei `require()` siano relativi alla directory `tests/`.

### Mock non funzionano
I mock devono essere dichiarati **prima** di richiedere il modulo da testare:

```javascript
jest.mock('../utils/jwt', () => ({
  verifyToken: jest.fn()
}));

const authMiddleware = require('../middlewares/authMiddleware');
```

### Test flaky
Usa `jest.clearAllMocks()` in `beforeEach` per evitare che i mock si influenzino tra test.

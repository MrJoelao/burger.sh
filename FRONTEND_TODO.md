# FRONTEND_TODO - burger.sh

Documento di lavoro per sistemare il front-end. Nasce da un'analisi di `frontend/src` fatta leggendo il codice, lo swagger (`backend/swagger/openapi.yaml`) e i docs (`docs/ita/`). I requisiti tecnici dei docs non contano: il front-end usa un altro stack (Preact + Vite + Tailwind), quello che conta e il comportamento atteso dalle funzionalita.

## Come usare questo documento

Chi ci lavora (umano o AI) parte dalla sezione 1 per capire la struttura reale, poi sceglie un task dalla sezione 6. Ogni task ha file, righe, azione e criterio di accettazione. I task sono in ordine di rapporto tra danno e sforzo: i primi sbloccano pagine rotate, gli ultimi sono pulizia.

## Stato (aggiornato dopo la sessione UX/UI)

Fatti e verificati (build + test verdi): T1, T2, T3, T4, T5, T7, T8, T9, T10, T11 e una parte di T6, piu tutti i task UX/UI della sezione 11 (T14-T22). Dettagli sulla fine di ogni task. La scelta T5 e stata: cancellazione di `validation/*` e rimozione della dipendenza `zod`, gli schemi usavano opzioni Zod 3 e nessuno li importava. Il wizard di registrazione (T15) e chiuso: la resa attuale e quella voluta, non servono altre iterazioni.

Le decisioni prese:

- flusso carrello: la conferma passa da `POST /cart/confirm` (T12, ultima voce). `createOrder` resta nel servizio ma nessuna pagina lo chiama piu: se non serve, si cancella
- mappe di stato: un solo modulo in `src/domain/orderStatus.js`, con `on_delivery` aggiunto perche l'enum dello swagger lo prevede e le pagine no
- scanner: montato `BurgerScanner` dentro `AssemblyLayout`, il markup hardcoded e una copia di cosa faceva gia il componente
- tutti gli accessi ai dati passano dai servizi: `grep -rn 'fetch(' frontend/src` restituisce solo `services/api.js`

Restano aperti: T6 (verifica campi con risposte reali), T12 (UI mancanti), T13 (architettura, in particolare `restaurantStore` non collegato). Blocco da risolvere col backend: `user.restaurantId` non e definito su `AuthUser`, senza quel campo la dashboard del manager non ha la filiale. La sezione 11 (task UX/UI, T14-T22) e chiusa: era nata dalla revisione del sito (larghezza desktop, wizard di registrazione, navigazione centrata, shell separate per manager e admin, home estesa, pagina profilo, setup al primo avvio, menu senza hardcode, polish) ed e tutta implementata.

Regole fisse:

- non riscrivere da zero quello che funziona (`MenuPage`, `RestaurantListPage`, `HomePage` sono integrati con le API e vanno lasciati)
- prima di cancellare un file, verifica con grep che nessuno lo importi (i comandi sono in sezione 9)
- dopo ogni task lancia `npm run frontend:test` (dalla root) e, se tocchi pagine, apri la pagina nel browser
- i path del backend sono quelli dello swagger: se un campo non torna, la fonte di verita e `openapi.yaml`

## 1. Struttura attuale

Entry point reale: `frontend/index.html` -> `frontend/src/main.jsx` -> `AppRouter` avvolto da quattro provider.

```
main.jsx
  ErrorBoundary
    UIStoreProvider        (state/uiStore.js)       toast, modali
      AuthStoreProvider    (state/authStore.js)     user, token, role
        RestaurantStoreProvider (state/restaurantStore.js)  filiali, menu  [MORTO in pratica]
          OrderStoreProvider     (state/orderStore.js)      carrello, ordini
            AppRouter      (router/AppRouter.jsx)
```

Router (`router/AppRouter.jsx`), tabella `ROUTES` righe 28-39:

| path | componente | ruoli |
|---|---|---|
| `/` | HomePage | pubblico |
| `/auth` | AuthLayout | pubblico |
| `/menu` | MenuPage | pubblico |
| `/restaurants` | RestaurantListPage | pubblico |
| `/orders/confirm` | OrderConfirmPage | customer |
| `/orders` | OrderHistoryPage | customer |
| `/orders/:id` | OrderDetailPage | customer, manager, admin |
| `/dashboard` | CustomerDashboard | customer |
| `/dashboard/manager` | ManagerDashboard | manager |
| `/dashboard/admin` | AdminDashboard | admin |

Layer dati corretto e funzionante in `frontend/src/services/`:

- `api.js`: `fetchWithAuth` inietta token, gestisce 401 (redirect a `/auth`), ritenta sugli errori di rete, base URL `/api`
- `authService`, `orderService`, `restaurantService`, `managerAdminService`, `paymentService`

Fonte di verita dei campi e degli endpoint: `backend/swagger/openapi.yaml`. Envelope risposta: `{ success, data }` e `{ success, data, pagination }` per le liste.

## 2. Il problema principale: due applicazioni

`frontend/src/App.jsx` (329 righe) contiene una seconda app completa, mai importata da nessuno:

- router a mano (`function App`, riga 294) con le sole home, auth e menu
- `AuthProvider` (riga 23), `ToastProvider` (riga 107), `OrderProvider` (riga 131) che duplicano gli store veri
- lista `recipes` hardcoded (righe 142-147)
- `login`/`register` con `fetch` inline (righe 34, 58, 74, 212, 225)

Verifica (gia fatta): `grep -rn "App.jsx\|from './App'" frontend/src/main.jsx frontend/src/router frontend/index.html` non trova nulla. `index.html` carica solo `main.jsx`, che a riga 28 monta `AppRouter`.

Conseguenza: tutto l'albero importato solo da `App.jsx` e di fatto morto. In particolare `components/UI/Toast.jsx` e vivo solo li dentro.

## 3. Chiamate API che aggirano i servizi

(Historico: tutti i punti qui sotto sono stati sistemati in T3, la tabella resta come tracciamento di cosa veniva aggirato.)

Il layer servizi esiste ma 7 pagine (piu `App.jsx`) lo ignorano e chiamano `fetch('/api/...')` a mano, prendendo il token da `useAuthStore().token`. Cosi perdono la gestione del 401, il retry e la centralizzazione degli errori.

| File | Righe | Endpoint | Metodo di servizio che esiste gia |
|---|---|---|---|
| `App.jsx` | 34, 58, 74, 212, 225 | `/users/me`, `/auth/login`, `/auth/register` | `authService.*` |
| `pages/Dashboard/AdminDashboard.jsx` | 26, 58 | `/admin/users`, `/admin/users/{id}` | `managerAdminService.getAllUsers/updateUser` |
| `pages/Dashboard/CustomerDashboard.jsx` | 34 | `/orders/user` | `orderService.getUserOrders` |
| `pages/Dashboard/ManagerDashboard.jsx` | 34 | `/orders/restaurant/{id}/dashboard` | `managerAdminService.getDashboard` |
| `pages/Order/OrderDetailPage.jsx` | 45 | `/orders/{id}` | `orderService.getOrder` |
| `pages/Order/OrderHistoryPage.jsx` | 51 | `/orders/user?status=...` | `orderService.getUserOrders` |

Dettaglio: ognuna di queste pagine importa il servizio e non lo usa. Import inutilizzati da rimuovere insieme al fetch: `AdminDashboard.jsx:12` (`managerAdminService`), `CustomerDashboard.jsx:11` (`orderService`), `ManagerDashboard.jsx:11` (`managerAdminService`), `OrderDetailPage.jsx:12` (`orderService`), `OrderHistoryPage.jsx:13` (`orderService`).

## 4. Codice morto

(Storico: cancellazioni eseguite in T4/T5/T11. La sezione resta come registro di cosa esisteva e perche e andato via, non descrive lo stato attuale: i file elencati sotto sono stati rimossi.)

Alla ricognizione originale (grep su tutto `frontend/src`) quei file non erano importati da nessun modulo vivo. Oggi `frontend/src/components/UI/` contiene solo `FormMessage.jsx`, `Loading.jsx` e `SectionHeading.jsx`.

### Criterio: usarlo dove era inteso o cancellarlo

Il dead code non si giudica allo stesso modo ovunque. La domanda da porsi: il posto "inteso" esiste ancora nell'app, o e stato superato da un'altra soluzione? Se la versione morta e migliore di quella che il codice vivo fa peggio, si collega. Se duplica qualcosa che funziona gia, o serve a una feature che nell'app non esiste proprio, si cancella.

Tre categorie con il verdetto che e stato applicato.

**Usati dove erano intesi:**

- `state/restaurantStore.js`: le pagine reimplementano a mano fetch e filtri che lo store ha gia. Resta da collegare (T13, ancora aperto)
- `managerAdminService`: le dashboard lo importavano e facevano fetch inline. Collegato in T3, ora e il canale usato dalle dashboard
- `components/Menu/BurgerScanner.jsx`: `AssemblyLayout` aveva una copia hardcoded dello scanner, il componente e parametrizzato. Montato nel redesign (T20)
- `validation/*`: `AuthForm` valida con regex inline, gli schemi Zod erano scritti per quello. T5 ha scelto la cancellazione: `validation/*` e la dipendenza `zod` sono state rimosse

**Eliminati:**

- `IdentityStrip`, `NavCommands`, `NavFooter`, `BufferList`, `BufferTotal`: versioni componentizzate di markup che vive gia inline e funziona. Collegarle era puro churn, zero valore per l'utente
- `UI/TerminalButton`: copia peggiore con API incompatibile
- `UI/Toast.jsx`: doppio meccanismo di toast, quello vivo (`uiStore`) funziona
- `LoginPage`, `RegisterPage`, `StaticScreens`: superati dal router attuale
- `App.jsx`: intera app parallela inutilizzata

**Decisione di prodotto, non di pulizia:**

- `paymentService`: non esisteva nessuna pagina dei metodi di pagamento. Non era codice da ripulire, era una feature mancante (prevista dai requisiti). Il file e stato rimosso, si riscrive dallo swagger quando serve. Vedi T12
- `restaurantService.create/update/delete` e i metodi dish: manca tuttora l'UI del manager per gestire filiale e menu. Vedi T12
- `Alert`, `Badge`, `Card`, `Navbar`: libreria UI generica mai usata. Cancellata in T4, ricrearla e banale

Un avvertimento sul rischio che ha portato il progetto qui: il codice "in attesa di essere usato" resta li per mesi, va fuori rotta (gli schemi Zod con opzioni Zod 3 ne sono la prova) e confonde chi legge. Nel dubbio cancella, git ti copre.

### Componenti

| File | Sostituito da |
|---|---|
| `components/Layout/IdentityStrip.jsx` | identity strip inline in `TerminalWindow.jsx:28-38` |
| `components/Nav/NavCommands.jsx` | nav inline in `TerminalWindow.jsx:41-48` |
| `components/Nav/NavFooter.jsx` | footer inline in `TerminalWindow.jsx` |
| `components/Order/BufferList.jsx` | lista dentro `Layout/OrderBuffer.jsx` |
| `components/Order/BufferTotal.jsx` | totali dentro `Layout/OrderBuffer.jsx` |
| `components/UI/TerminalButton.jsx` | `components/Auth/TerminalButton.jsx` (vivo) |
| `components/UI/Navbar.jsx` | `components/Layout/TitleBar.jsx` |
| `components/UI/InputPrompt.jsx` | nessuno |
| `components/UI/Alert.jsx` | nessuno |
| `components/UI/Badge.jsx` | nessuno |
| `components/UI/Card.jsx` | nessuno |
| `components/UI/WindowControls.jsx` | markup inline in `ErrorBoundary.jsx:39`, `TitleBar.jsx:26` |
| `components/UI/Toast.jsx` | `showToast` in `state/uiStore.js` (l'unico vivo) |
| `components/UI/index.js` | barrel che nessuno importa |

`UI/Alert.jsx`, `UI/Badge.jsx`, `UI/Card.jsx`, `UI/Navbar.jsx`, `UI/InputPrompt.jsx`, `UI/TerminalButton.jsx` avevano un file di test dedicato che li importava: componenti e test sono stati cancellati insieme in T4.

### Pagine

| File | Nota |
|---|---|
| `pages/Auth/LoginPage.jsx` | wrapper attorno ad `AuthForm`, nessuno lo importa. Il flusso auth vero passa da `AuthLayout` + `AuthRoute` in `AppRouter.jsx:104-157` |
| `pages/Auth/RegisterPage.jsx` | come sopra |
| `pages/Menu/StaticScreens.jsx` | esporta `MenuCompleteScreen`, `AllergensScreen`, `ManifestoScreen` (righe 54, 58, 62). Nessuno li importa. Contiene prezzi finti (righe 14-17) |

### Servizi

| File / metodo | Nota |
|---|---|
| `services/paymentService.js` | mai importato: rimosso. Da riscrivere se serve la UI pagamenti (T12) |
| `services/managerAdminService.js` | importato ma non chiamato nella ricognizione: risolto in T3, ora le dashboard lo usano |
| `restaurantService.createRestaurant/updateRestaurant/deleteRestaurant` | mai chiamati: manca l'UI manager (T12) |
| `authService.deleteAccount` | mai chiamato: manca la UI profilo (T12/T19) |

### Validazione

`validation/authSchemas.js`, `orderSchemas.js`, `restaurantSchemas.js`, `dishSchemas.js` non erano importati da nessun file. T5 ha rimosso l'intera cartella e la dipendenza `zod`: la validazione ora e solo quella inline in `AuthForm` (regex) e nel wizard.

Nota storica: gli schemi usavano opzioni di Zod 3 (`errorMap` in `authSchemas.js:20-22` e `orderSchemas.js:18-20`, `invalid_type_error` in `dishSchemas.js:15`) che Zod 4.6.2 ignora in silenzio, quindi anche collegandoli i messaggi custom non sarebbero apparsi.

### Store

`state/restaurantStore.js` non e importato da nessuna pagina. E il posto naturale da cui `MenuPage` e `RestaurantListPage` dovrebbero prendere i dati, invece reimplementano la logica a mano. Ancora aperto (T13).

## 5. Concetti scritti piu volte

| Concetto | Copie |
|---|---|
| TerminalButton | `Auth/TerminalButton.jsx` (vivo), `UI/TerminalButton.jsx` (morto) |
| Identity strip | inline `TerminalWindow.jsx:28-38`, `IdentityStrip.jsx` |
| Scanner burger | inline hardcoded `AssemblyLayout.jsx:27-42`, `Menu/BurgerScanner.jsx` |
| Nav + footer | inline `TerminalWindow.jsx:41-48`, `Nav/NavCommands.jsx` + `NavFooter.jsx` |
| Lista/totali carrello | inline `Layout/OrderBuffer.jsx`, `Order/BufferList.jsx` + `BufferTotal.jsx` |
| Window controls | inline `ErrorBoundary.jsx:39`, `TitleBar.jsx:26`, `UI/WindowControls.jsx` |
| Toast | `UI/Toast.jsx`, `ToastProvider` in `App.jsx:107`, `state/uiStore.js` (vivo) |
| `statusLabels`/`statusColors` | `CustomerDashboard.jsx:14-21`, `OrderDetailPage.jsx:14-30`, `OrderHistoryPage.jsx:16-32`, `ManagerDashboard.jsx:13-16` |
| Ricette di default | `state/orderStore.js:14-19`, `App.jsx:142-147`, `RecipeMatrix.jsx:9-14`, `SelectionPanel.jsx` |
| Validazione | regex `AuthForm.jsx`, Zod `validation/*`, Zod `InputPrompt.jsx` |
| `validate(schema, data)` | identico nei 4 file di `validation/` |

Caso a parte, `AssemblyLayout.jsx`: importa `BurgerScanner` e `SelectionPanel` ma disegna uno scanner hardcoded per conto suo. `MenuPage.jsx` importa `BurgerScanner` (riga 9) e `SelectionPanel` (riga 10) e non li renderizza. Tre file che si passano pezzi di UI che nessuno usa.

## 6. Task

### T1 - FATTO - Ripristinare gli import mancanti (sblocca 3 pagine)

Tre pagine usano un componente senza importarlo, quindi crashano al render.

- `pages/Dashboard/CustomerDashboard.jsx`: usa `TerminalButton` a riga 122, non importato. Import attuali (righe 6-12): `html`, `useState/useEffect`, `TerminalWindow`, `SectionHeading`, `useAuthStore`, `orderService`, `navigate`. Aggiungi `import { TerminalButton } from '../../components/Auth/TerminalButton.jsx';`
- `pages/Dashboard/ManagerDashboard.jsx`: usa `TerminalButton` a riga 112 e non lo importa. Stessa aggiunta.
- `pages/Restaurants/RestaurantSearch.jsx`: usa `SectionHeading` a riga 19, non importato. Import attuali (righe 6-8): `html`, `TerminalButton`, `FormMessage`. Aggiungi `import { SectionHeading } from '../../components/UI/SectionHeading.jsx';`

Accettazione: apri `/dashboard`, `/dashboard/manager` e `/restaurants` con sessione attiva, le tre pagine renderizzano senza errore in console.

Nota: `RestaurantSearch` e renderizzato da `RestaurantListPage.jsx:131`, quindi il crash si vede anche su `/restaurants`.

### T2 - FATTO - Cancellare `App.jsx`

Azione:

1. verifica che nessuno lo importi (comando in sezione 9, deve dare zero risultati oltre al file stesso)
2. cancella `frontend/src/App.jsx`
3. dopo la cancellazione, `components/UI/Toast.jsx` resta senza alcun import: e gia in T4

Attenzione: `App.jsx` esporta `AuthContext`, `ToastContext`, `OrderContext`, `AuthProvider`, `ToastProvider`, `OrderProvider`, `App`. Nessuno di questi nomi e usato fuori dal file (gli store veri usano nomi diversi o sono in `state/`). Verifica comunque con grep prima di cancellare.

Accettazione: `npm run frontend:build` senza errori e l'app continua a girare su tutte le route.

### T3 - FATTO - Far passare le pagine dai servizi invece che dal fetch grezzo

Per ogni riga della tabella in sezione 3:

1. sostituisci il blocco `fetch('/api/...')` con la chiamata al metodo di servizio gia importato
2. rimuovi l'header `Authorization` manuale (lo mette `api.js`)
3. rimuovi il token locale se non serve piu (`useAuthStore().token` in quelle pagine serve solo al fetch)
4. l'import del servizio, se diventa inutilizzato, rimuovilo

Esempio, `CustomerDashboard.jsx:34`, da:

```js
const response = await fetch('/api/orders/user', { headers: { Authorization: `Bearer ${token}` } });
const data = await response.json();
```

a:

```js
const data = await orderService.getUserOrders();
```

Codice da togliere dopo: l'import a riga 11.

Accettazione: nelle pagine toccate, un 401 porta al redirect di `api.js` verso `/auth` (prima no), e gli errori arrivano come `ApiError` con `status`.

### T4 - FATTO - Cancellare i componenti e le pagine morti

Cancella i file della tabella in sezione 4 (componenti, pagine). Per i componenti con test (`Alert`, `Badge`, `Card`, `Navbar`, `InputPrompt`, `TerminalButton` in `UI/`) cancella anche il `.test.jsx` corrispondente.

Per i doppioni con una versione viva, non cancellare a cuor leggero: decidi prima quale tenere. Il criterio completo e nella sezione 4 ("Criterio: usarlo dove era inteso o cancellarlo").

- Identity strip, nav, footer carrello: oggi il vivo e l'inline in `TerminalWindow.jsx` e `Layout/OrderBuffer.jsx`. Se preferisci i componenti separati (`IdentityStrip`, `NavCommands`, `NavFooter`, `BufferList`, `BufferTotal`), montali dentro `TerminalWindow`/`OrderBuffer` e cancella l'inline. Scegli una strada, non tenere entrambe.
- Scanner: monta `Menu/BurgerScanner.jsx` in `AssemblyLayout.jsx` al posto del markup hardcoded (righe 27-42), oppure cancella `BurgerScanner.jsx`. Nota che `MenuPage.jsx:9` importa `BurgerScanner` senza usarlo: risolvi anche quello.
- TerminalButton: tieni `Auth/TerminalButton.jsx` (usato da router e 6 pagine), cancella `UI/TerminalButton.jsx`.

Accettazione: dopo la cancellazione, `npm run frontend:build` pulito e `npm run frontend:test` verde (i test dei componenti cancellati se ne vanno con loro).

### T5 - FATTO - Decidere il destino di `validation/*`

Due strade, scegline una:

- collegarli davvero: usare `authSchemas.loginSchema/registerSchema` in `components/Auth/AuthForm.jsx` (oggi validazione regex inline a righe 38-60) e `orderSchemas` in `OrderConfirmPage.jsx`. In questo caso aggiorna le opzioni a Zod 4 (`errorMap` e `invalid_type_error` non funzionano piu)
- cancellarli: via i 4 file e la dipendenza `zod` se resta solo in `InputPrompt.jsx` (che a sua volta e morto, vedi T4)

Accettazione: nessun file di `validation/` resta senza un import reale, oppure non esistono piu.

### T6 - PARZIALE - Allineare i campi allo swagger

Fatto: `order.id || order._id` e `order.orderItems` nelle pagine ordine, `item.dishId?.name` nel dettaglio, `dish.quantitySold` nel dashboard del manager, `user.id || user._id` nel dashboard admin, `restaurant.id || restaurant._id` in `RestaurantListPage`.

Da fare: verificare con un backend attivo che le risposte reali combacino, in particolare:

- `order.restaurantName`: lo swagger non lo definisce, il dettaglio ordine ora legge il `restaurantId` popolato (oggetto con `name`). Se il backend non popola la ref, il nome filiale resta "Filiale sconosciuta"
- `orderStore.js` (fetchCart e cart operations) legge ancora `response.data.items`: il nome `orderItems` vale per l'Order, verificare qual e il campo reale della risposta del carrello e allinearne i punti (righe originali 70, 90, 103, 116)

Il front-end legge nomi che lo swagger non definisce. O si allinea il front-end, o il backend denormalizza. Chiedi prima quale, poi:

| Dove | Frontend legge | Swagger (`openapi.yaml`) |
|---|---|---|
| `state/orderStore.js` (70, 90, 103, 116) | `response.data.items` | `orderItems` (riga 1452) |
| `CustomerDashboard.jsx`, `OrderHistoryPage.jsx`, `OrderDetailPage.jsx` | `order.id`, `order.items`, `order.restaurantName` | `_id`, `orderItems`, niente `restaurantName` |
| `OrderDetailPage.jsx:220-227` | `item.name`, `item.dishName` | `OrderItem` ha solo `dishId`, `quantity`, `unitPrice` (righe 1413-1425) |
| `ManagerDashboard.jsx:105` | `dish.count` | `quantitySold` (riga 1494) |
| `AdminDashboard.jsx:75` | `user.id` | `_id` (riga 1306) |
| `RestaurantListPage.jsx:150` | `restaurant.id` | `_id` (riga 1348) |

`MenuPage.jsx:34,70` e l'unico che si difende (`dish.id || dish._id`): usalo come modello.

Accettazione: carrello e liste ordini mostrano i dati veri con il backend reale, non array vuoti.

### T7 - FATTO - Sistemare `OrderConfirmPage.jsx`

Esito: la conferma passa da `POST /cart/confirm` via `orderStore.confirmCart(mode, delivery)` (nuovo metodo in `orderService`). Fuori il `restaurantId` hardcoded e il payload con `unitPrice` dal client, che il server ricalcola comunque. Navigazione interna: conferma → `/orders/{id}`, indietro → `/menu`. Le prop `onConfirm`/`onBack` non esistono piu.

Problemi:

- riga 47: `restaurantId: '64b7a0f9a1234567890abcd0'` hardcoded, con commento "Would come from selected restaurant". Il ristorante va scelto davvero (dal contesto di `MenuPage` o da una prop di route) e passato qui
- righe 60 e 188: `onConfirm` e `onBack` sono prop, ma `AppRouter.jsx:33` monta la route `/orders/confirm` con `props` vuoti. Quindi dopo la conferma non succede niente e il pulsante indietro e morto. Collega la navigazione dentro la pagina (usa `navigate` da `router/navigate.js`) o passa le prop dalla route
- righe 49-53: manda `dishId: item.id || 'placeholder'` e `unitPrice: item.price`. Verifica che i nomi combacino con l'item del carrello restituito dal backend

Accettazione: da `/menu` scegli piatti, vai a `/orders/confirm`, confermi e vieni portato a un ordine reale; "indietro" torna al menu.

### T8 - FATTO - Sistemare `OrderHistoryPage.jsx`

Esito: tab `all` / `current` / `past`, filtro solo lato server, tolto il doppio livello e `filteredOrders`. Il tab "annullati" e stato rimosso insieme al filtro client: lo swagger non prevede piu la sovrascrittura `cancelled/active/completed` sul server, e il filtro lato client su un risultato gia filtrato portava liste vuote.

- riga 48: manda `status=active` / `status=completed` / `status=cancelled`. Lo swagger (`openapi.yaml:756`) accetta solo `enum: [past, current]`. Correggi i valori dei tab in `filterTabs` (righe 93-95) o smetti di mandarli
- righe 98-104: filtra di nuovo lato client su un risultato che il server ha gia filtrato. Scegli un solo livello: filtro server (e niente `filteredOrders`) o filtro client (e nessun `?status`)

Accettazione: i tab past/current restituiscono gli ordini giusti, nessuna lista vuota a sorpresa.

### T9 - FATTO - Sistemare `AdminDashboard.jsx`

Esito: `role: 'manager'` aggiunto al filtro. La sezione statistiche vuota e stato tolta, soltanto rimozione: `getStats()` non aveva ancora una UI che lo consumasse ed e restato nel servizio per T12.

- riga 26: chiede `managerStatus=pending` senza `role=manager`, ma lo swagger (`openapi.yaml:1118`) dice che `managerStatus` vale solo insieme a `role=manager`. Aggiungi il filtro
- riga 125: la sezione statistiche e uno stub ("Additional admin stats can be added here"). O la colleghi a `managerAdminService.getStats()` o la togli

Accettazione: la lista manager pending si popola correttamente.

### T10 - FATTO - Bug minori

Esito: `Loading` renderizza `message`, guard su `RecipeButton` se il separatore manca, `FormMessage` usa `var(--alert)` per errore, il pulsante `[ F5 ] aggiorna stato` esegue `fetchOrder`, `autocomplete="email"` semplificato, `ErrorBoundary` rimonta il sottoalbero con una `key` fresca al reset.

| File | Riga | Problema | Azione |
|---|---|---|---|
| `components/UI/Loading.jsx` | 9 | ignora la prop `message` | leggi `message` e renderizzala, oppure togli la prop dai 4 chiamanti (`AdminDashboard:91`, `ManagerDashboard:68`, `OrderDetailPage:93`, `OrderHistoryPage:123`) |
| `components/Menu/RecipeButton.jsx` | 27 | `code.split(' / ')[1].toLowerCase()` senza guardia, crash se manca il separatore | usa optional chaining o un fallback |
| `components/UI/FormMessage.jsx` | 17-18 | `colors.error` e `colors.success` sono entrambi `var(--acid)` | dai colori diversi a errore e successo |
| `pages/Order/OrderDetailPage.jsx` | 243 | pulsante "[ F5 ] aggiorna stato" `disabled` senza `onClick` | collega l'aggiornamento o rimuovi il controllo |
| `components/Auth/AuthForm.jsx` | 105 | `autocomplete=${isRegister ? 'email' : 'email'}` con i due rami uguali | semplifica |
| `components/ErrorBoundary.jsx` | 29-31 | `handleReset` azzera l'errore ma ri-renderizza lo stesso sottoalbero che rilancia | forza un remount del sottoalbero (cambia una `key`) |

### T11 - FATTO - Consolidare i doppioni rimasti

Esito: `statusLabels`/`statusColors`/`statusOrder` in `src/domain/orderStatus.js` (con `on_delivery` aggiunto), un solo toast (`uiStore`), un solo `TerminalButton` (`Auth/TerminalButton.jsx`), scanner montato come componente.

Non fatto: una sola fonte per le ricette di default. Restano le copie hardcoded in `orderStore.js` (fallback prima del fetch menu), `RecipeMatrix.jsx` (default prop) e `SelectionPanel.jsx` (default prop). Sono fallback innocui ma sono ancora tre copie dello stesso elenco.

- estrai `statusLabels`/`statusColors` in un modulo unico (es. `src/domain/orderStatus.js`) e importalo nelle 4 pagine
- tieni un solo meccanismo di toast: `state/uiStore.js`
- scegli un solo TerminalButton (`Auth/TerminalButton.jsx`) e un solo modo di rendere i window controls
- tieni una sola fonte per le ricette di default (non 4)

Accettazione: nessuna mappa di stato duplicata, un solo toast provider, un solo TerminalButton nel codice vivo.

### T12 - Feature mancanti: endpoint coperti ma senza UI

Questi non sono dead code da cancellare in fretta: sono feature che i requisiti prevedono, il backend le offre e il front-end non ha mai costruito. Cancella i wrapper ora (e gia coperto dai task di cancellazione), ricrealli quando costruisci l'UI, i path sono tutti nello swagger.

- Metodi di pagamento del cliente (`GET/POST/PUT/DELETE /users/me/payment-methods`): `paymentService` e gia pronto e verificato sui path. Manca la pagina di gestione e il campo nel checkout
- Menu e filiale del manager (`POST /restaurants`, `PUT/DELETE /restaurants/{id}`, `POST /dishes` e `GET /dishes/restaurant/{id}` per i piatti custom di filiale): nessuna UI per aggiungere, modificare o rimuovere piatti. E un requisito chiave del docs
- Avanzamento stato ordine (`PATCH /orders/{id}/status`): `managerAdminService.updateOrderStatus` non e mai chiamato. Il manager oggi vede la dashboard ma non puo spostare un ordine da `ordered` a `preparing` a `ready`, quindi il flusso di consegna si ferma. Sta bene come lista di azioni nella dashboard o nel dettaglio ordine, lato manager
- Conferma consegna cliente (`PATCH /orders/{id}/confirm-delivery`): `orderService.confirmDelivery` esiste ma nessuna pagina lo chiama. Sta bene nel dettaglio ordine quando lo stato e `on_delivery`, che e anche il modo sano di riempire il pulsante morto di T10
- Conferma carrello (`POST /cart/confirm`): il front-end usa `POST /orders` diretto in `OrderConfirmPage`. Decidi quale flusso e quello giusto e togli l'altro. Consiglio: conferma carrello, cosi il backend gestisce la creazione dell'ordine, i totali e lo stato iniziale invece di fidarsi dei totali calcolati dal client

Intoppo da risolvere prima di costruire le UI manager: `ManagerDashboard.jsx:34` usa `user.restaurantId`, che lo swagger non definisce su `AuthUser`. O il backend aggiunge il campo a `/users/me`, o la dashboard non sa a quale filiale serve. Da decidere con chi tiene il backend.

Accettazione: ogni endpoint dello swagger usabile da un ruolo ha una UI che lo chiama, o una nota che dice perche no.

### T13 - Miglioramenti oltre i bugfix

Architettura, da fare dopo la pulizia quando il rumore e via. Non blocano nulla, ma rendono il resto piu semplice da cambiare.

- Flusso ordine in un solo posto. Oggi `MenuPage` chiama `restaurantService` e costruisce le ricette, `OrderConfirmPage` costruisce il payload dell'ordine e chiama `createOrder`. La scelta della filiale e le regole del carrello non appartengono a nessuna pagina: vanno in `orderStore`, insieme a `fetchCart`, `addCartItem` e alla conferma. Le pagine restano solo view: mostrano e inviano, senza conoscere le regole. E la parte di consolidamento con piu valore perche il flusso ordine e il cuore dell'app
- `restaurantStore` diventa il passaggio obbligato per filiali e menu. `MenuPage` e `RestaurantListPage` oggi chiamano `restaurantService` direttamente a mano. Lo store ha gia fetch, filtri e paginazione (righe 24-95): collegalo, cosi caching e filtri vivono in un posto
- `TerminalWindow` con una sola responsabilita. Fatti i cancellamenti di T4, resta un guscio che fa layout + identity strip + nav + footer + montaggio carrello, cinque cose in un file (righe 26-58). Dopo la scelta inline-vs-componenti, tieni il file sul layout e togli il resto inline. Non e urgente, ma e il file che ogni pagina importa, quindi ogni semplificazione vale per tutto
- Regola permanente: nessun `fetch` fuori da `services/`. T3 la ripristina una volta, questa riga la tiene. Se una nuova pagina ha bisogno di un endpoint, prima si aggiunge il metodo al servizio

Accettazione: una nuova schermata che mostra filiali piatti e ordini si scrive importando store e servizi, senza aggiungere fetch o ricostruire logiche esistenti.

## 7. Note di design (SOLID)

Il quadro sopra letto secondo SOLID:

- Single Responsibility: `TerminalWindow.jsx` fa layout, titlebar, identity strip, nav, footer e monta il carrello. `AssemblyLayout.jsx` fa layout e disegna anche lo scanner.
- DRY oltre la Rule of Three: le mappe di stato ordine sono scritte quattro volte. Il concetto "stato ordine" merita un solo modulo.
- Dependency Inversion: le pagine dipendono da `fetch` invece che dal layer `api.js`. Il layer esiste ma non e obbligatorio.
- Interface Segregation: `TerminalButton` ha due interfacce incompatibili (`children` vs `label`).
- YAGNI: `validation/*`, `paymentService`, i componenti `UI/*` sono stati costruiti "per completezza" prima che servissero.

Pattern ricorrente: ogni file sembra scritto senza vedere i fratelli. Moduli larghi (molte responsabilita) con integrazione superficiale (import usati e ignorati). L'opposto di moduli focalizzati con interfacce che li collegano.

## 8. Test

Esistono 7 file di test:

- `pages/Auth/AuthLayout.test.jsx`, `pages/Auth/RegisterWizard.test.jsx`, `components/Auth/AuthPanel.test.jsx`
- `components/Layout/TitleBar.test.jsx`, `TitleBarConsistency.test.jsx`
- `components/UI/Loading.test.jsx`
- `router/navigate.test.js`

I tre file in `Auth` coprono il layout di accesso e il wizard: l'aside solo in login, il layout a tutta larghezza in register, la griglia a due colonne dei campi e l'header che segue i passi. Il resto copre componenti UI isolati. I flussi ordine e carrello restano scoperti: se aggiungi test, parti da `state/orderStore.js`, e li che i disallineamenti di campo con lo swagger emergono subito.

Comandi:

```
npm run frontend:test        # dalla root, esegue vitest in frontend/
npm run frontend:build       # build di verifica
```

## 9. Comandi di verifica

Da lanciare dalla root del progetto.

Chi importa un file (sostituisci `NOMEFILE`):

```
grep -rn "NOMEFILE" frontend/src --include=*.jsx --include=*.js
```

Confermare che `App.jsx` non e importato:

```
grep -rn "App.jsx\|from './App'" frontend/src/main.jsx frontend/src/router frontend/index.html
```

Trovare i fetch che aggirano i servizi:

```
grep -rn "fetch(\|'/api" frontend/src --include=*.jsx --include=*.js
```

Elenco dei file di test:

```
find frontend -name "*.test.*" -not -path "*/node_modules/*"
```

## 10. Ordine consigliato

Fatto T1-T11 (T6 parziale). Lavoro rimasto, in ordine:

1. verificare T6 con backend attivo: campi del carrello, `restaurantName` popolato, flusso del checkout reale
2. decidere col backend il problema `user.restaurantId` su `AuthUser` (blocca la dashboard del manager)
3. T12: UI manager per menu/filiale, avanzamento stato ordine (`updateOrderStatus` esiste nel servizio, nessuno lo chiama), conferma consegna cliente nel dettaglio ordine, metodi di pagamento
4. T13: collegare `restaurantStore` a `MenuPage`/`RestaurantListPage`, flusso ordine in `orderStore`, `TerminalWindow` a responsabilita unica
5. decidere il destino di `orderService.createOrder` (nessuna pagina lo chiama piu dopo il passaggio a `confirmCart`)

I primi due sono a basso rischio e liberano molto rumore. Fatto quello, il resto si legge molto piu chiaro.

## 11. Task UX e UI (analisi nuova sessione)

Stato sessione: T14, T15, T16, T17, T18, T19, T20, T21 e T22 implementati. La sezione e chiusa e resta come registro; T6 resta dipendente dalle risposte reali del backend, in particolare per la filiale del manager.

Ogni task conteneva lo stato, le cause e come implementarlo. Erano redesign, non bugfix: toccavano gli stessi file di T12/T13, per questo vennero messi dopo la pulizia e prima di qualunque feature nuova.

Piano rapido, dai problemi segnalati ai task:

1. su desktop la pagina e piu stretta dello schermo e resta spazio ai lati, T14
2. la registrazione e illeggibile, box uno sotto l'altro e ruolo scelto in fondo, T15
3. i link ordina/accedi non stanno al centro e si spostano tra le pagine, T16
4. manager e admin usano la stessa UI del cliente, T17
5. la home non usa lo spazio in basso, T18
6. manca la pagina di gestione del profilo, T19
7. manca il flusso di primo avvio con PIN, T20
8. il menu mostra piatti hardcoded e non fa scegliere la filiale, T21
9. le pagine sembrano "attaccate con lo scotch", T22

### T14 - Uso della larghezza su desktop

Stato: fatto. Esito: il console usa lo spazio desktop fino a 1780px e la griglia centrale assorbe la larghezza disponibile.

Stato attuale: `.console` (terminal.css:18-26) ha `width: min(1540px, calc(100vw - 40px))` con `margin: 20px auto`. Su un monitor da 1920px o piu restano bande vuote oltre 150px per lato, e il grid interno `.terminal-grid` non si allarga: le colonne sono dimensionate su 1540px. Le pagine intro e access ereditano lo stesso limite.

Come intervenire:

- alzare il cap di `.console` (terminal.css:20), per esempio `min(1780px, calc(100% - 96px))`, oppure layout fluido con cap alto tipo `min(96vw, 1920px)`. Non scendere sotto 1440: il tema e pensato per schermi larghi
- `.terminal-grid` (terminal.css:212) oggi e `grid-template-columns: 180px minmax(0, 1fr) 280px`: le due laterali sono fisse, la centrale prende solo l'avanzo. Passare a `minmax(180px, 220px) minmax(0, 1fr) minmax(240px, 300px)`, cosi la colonna centrale assorbe lo spazio aggiuntivo
- verificare i breakpoint esistenti (900, 700, 420, non 1050): il collasso a una colonna deve continuare a funzionare
- i max-width interni (550, 620, 380) sono limiti di leggibilita del testo: non toccarli

Verifica: a 1920 e 2560 il contenuto usa lo schermo senza superare circa 90 caratteri per riga; sotto 1440 il rendering resta quello attuale.

### T15 - Registrazione guidata (wizard animato)

Stato: fatto. Esito: registrazione divisa in cinque passi con ruolo iniziale, validazione locale, animazione e payload compatibile con RegisterRequest. In register l'aside laterale non viene renderizzato e il wizard occupa tutta la larghezza del console con i campi su due colonne; il login resta invariato.

Stato attuale: `AuthForm.jsx` in modalita register impila in una colonna nome, cognome, email, password, conferma, ruolo (select in fondo), via, citta, cap e sette checkbox preferenze. Dieci blocchi richiesti tutti insieme e il tipo di account si scopre solo arrivati in fondo.

Problemi: la scelta customer/manager condiziona tutto il resto (per lo swagger il manager parte con `managerStatus: pending` e serve approvazione admin) ma arriva come campo 6 di 10; la form non spiega perche ogni dato serve.

Implementazione:

- nuovo `src/pages/Auth/RegisterWizard.jsx`. Step: 0 scelta ruolo, 1 identita, 2 credenziali, 3 indirizzo, 4 preferenze. Stato in un solo oggetto `answers` via `useState`
- il ruolo si sceglie al passo 0 con due schede grandi (cliente / manager) con descrizione di cosa cambia, non una select. Resta un chip modificabile fino al submit
- transizione CSS tra passi: `transition` su `transform: translateX` o fade. Bastano le CSS, niente librerie di animazione
- a ogni passo una riga di spiegazione del perche quel dato serve, testo reale
- per il manager il passo indirizzo puo diventare selezione filiale, e si mostra il box che l account andra in approvazione admin
- validazione per passo, stessa logica di `AuthForm.validate` ma spezzata: ogni stato con le sue regole
- il wizard sostituisce `AuthForm` solo in modalita register: il login resta unica schermata
- `AuthPanel.jsx` tiene la copy per mode, con `config.register` come array allineato ai cinque passi: l'header mostra eyebrow, titolo e sottotitolo del passo corrente. Lo stato del passo resta interno al pannello, aggiornato dal wizard via `onStepChange`; la callback non risale piu ad `AuthLayout`, che non la usa
- `AuthLayout.jsx` monta l'aside (wordmark, `IL TUO POSTO NELLA CODA.`, tre meta in basso) solo per il login. In register l'aside non viene renderizzato e la sezione prende la classe `register-layout`: `.access-layout` collassa a una colonna e `.auth-panel` si allarga a `min(820px, calc(100% - 48px))`, cosi il wizard usa tutta la larghezza invece di restare in meta schermo
- nel pannello largo i campi vanno su due colonne (`.wizard-fields.two-up`), con `email` e `via` a piena larghezza via `.wizard-field.wide` (`grid-column: 1 / -1`); le sette preferenze usano `repeat(auto-fit, minmax(190px, 1fr))` e si dispongono da sole senza media query
- i campi del register devono combaciare con `RegisterRequest` (swagger:1535): obbligatori `name, surname, email, password, role`, opzionali `address{street,city,zip}` e `preferences`. Le 7 preferenze sono un enum chiuso (`Preference`, swagger:1281), restano quelle
- il ruolo va mappato su `role: customer | manager` (unico enum ammesso da register); per il manager mostrare che l'account nasce `managerStatus: pending`

`AuthLayout.jsx` resta il wrapper visivo: in login aside piu pannello a due colonne, in register una sola colonna a tutta larghezza con l'aside nascosto. La copy del pannello segue i passi del wizard.

### T16 - Navigazione in alto centrata e stabile

Stato: fatto. Esito: titlebar a tre colonne con navigazione centrata e link di larghezza stabile.

Stato attuale: `components/Layout/TitleBar.jsx` impila window-controls, brand (un paragrafo elastico), `nav.top-links` e `machine-state`. In CSS sia `.top-links` (terminal.css:102) sia `.machine-state` (terminal.css:122) hanno `margin-left: auto`: due auto margin si spartiscono lo spazio libero, quindi i link non stanno al centro dello schermo ma a ridosso di `machine-state`. Il testo del brand cambia con la sezione (`burger.sh / welcome / production` vs `burger.sh / kitchen-ops / production console`), quindi la larghezza sinistra varia da pagina a pagina e il nav slitta anche a parita di link ordina/accedi.

Implementazione:

- titlebar come grid a tre colonne: brand `auto`, nav centrato con `justify-self: center`, stato `auto`. Il nav smette di reagire alla larghezza del brand
- alternativa piu semplice: `position: absolute` del nav con `left: 50%` e `transform: translateX(-50%)`, con attenzione alle sovrapposizioni su schermi stretti
- bene dare ai due link una larghezza minima uguale, cosi nemmeno il passaggio del `current` tra i due sposta niente
- controllare la variante mobile a 700px dove il layout cambia
- non rompere il contratto dei test: `TitleBarConsistency.test.jsx` pretende un nav con `aria-label="Navigazione principale"` linkato nell'ordine `ordina, accedi`, uguali tra `AuthLayout` e `TerminalWindow`, e `TitleBar.test.jsx` copre il resto. I due link nascono da `DEFAULT_NAV_LINKS` (TitleBar.jsx:11-14)

### T17 - Area manager e admin separate dalla UI cliente

Stato: fatto. Esito: manager e admin usano shell operative senza carrello cliente, con directory e rotte protette per ruolo.

Stato attuale: `ManagerDashboard` e `AdminDashboard` montano lo stesso `TerminalWindow` del cliente, con identity-strip `food assembly interface`, carrello `OrderBuffer` e directory `nuovo ordine / menu completo / allergeni / manifesto`. Le dashboard di gestione vivono dentro una conchiglia pensata per ordinare burger. `TerminalWindow.jsx` codifica fisso tutto questo: `identity-strip` con `food assembly interface / 02` e la frase "Componi l'ordine..." (righe 28-38), i quattro `nav-command` (righe 43-46, bottoni senza `onClick`, oggi inerti), il `footer-status` con "enter add item / esc clear" (righe 61-67) e la colonna `OrderBuffer` (riga 58). `ManagerDashboard` legge inoltre `user.restaurantId` (righe 32 e 48) e `user.restaurantName` (riga 55): nessuno dei due esiste in `AuthUser` (swagger:1322).

Implementazione:

- due layout dedicati: `components/Layout/ManagerShell.jsx` e `AdminShell.jsx`. Stesso linguaggio terminale ma directory diversa (per manager: menu, ordini filiale; per admin: utenti, statistiche, filiali), senza carrello
- router: si aggiungono percorsi `/manager/*` e `/admin/*` con i role check esistenti. Si collega a T12: `/manager/menu` per gestione piatti, `/manager/orders` per avanzamento stato ordine, `/admin/users` per approvazioni
- le due dashboard sostituiscono `TerminalWindow` con le Shell nuove, stesse prop. Il styling resta coerente: cambia navigazione e via il carrello
- `TitleBar` resta unico, cambia in `section` e `links`

Accettazione: il manager vede solo viste di gestione, zero riferimenti all ordinazione; il cliente non tocca mai le Shell manager/admin.

### T18 - Home: usare lo spazio in basso

Stato: fatto. Esito: aggiunti monitor backend, conteggi filiali/piatti e protocollo d'ordine sotto l'hero, con fallback offline.

Stato attuale: `HomePage.jsx` e hero + `intro-board` (3 articoli) + footer-status. Tutto sta dentro una viewport, sotto non c e niente. Nessun dato reale, solo dichiarazioni statiche.

Implementazione:

- sezione bassa con stato live del backend. `GET /api/health` (backend/app.js:68) restituisce solo `{ success, message }`, senza contatori: `online/offline` deriva dall'esito di `/health`, i numeri (filiali e piatti) vengono da `restaurantService.getRestaurants()` e `getDishes()`. Un metodo `health` in un servizio oggi non esiste, va aggiunto
- sezione come funziona un ordine: tre passi (scegli filiale, componi, conferma) con la stessa estetica
- senza backend attivo la sezione mostra `offline` con fallback estetico, non errore
- il footer-status esistente si sposta dopo la nuova sezione

Accettazione: la home ha contenuto sotto il fronte che arriva a scroll, nessun testo segnaposto.

### T19 - Pagina profilo mancante

Stato: fatto. Esito: aggiunta `/profile` con modifica dati, indirizzo e preferenze e aggiornamento dell'utente in authStore.

Stato attuale: lo swagger definisce GET `/users/me` e PUT `/users/me` (schema `UpdateProfileRequest`), ma non esiste pagina: il cliente non puo aggiornare indirizzo o preferenze, il manager non vede la sua filiale.

Implementazione:

- `authService.getProfile` e `authService.updateProfile` esistono gia (authService.js:45-55): non riaggiungerli
- `PUT /users/me` accetta `name, surname, email, password, address, preferences` (schema `UpdateProfileRequest`, swagger:1561), quindi la pagina puo modificare anche email e password, non solo indirizzo e preferenze
- nuova route `/profile` (ruoli customer, manager, admin) e pagina `pages/Profile/ProfilePage.jsx`: in sola lettura `role` e `managerStatus`, modificabili i campi di `UpdateProfileRequest`, con `address` a tre campi (`street`, `city`, `zip`)
- l`updateProfile` va collegato anche ad `authStore`, cosi `user` in memoria si aggiorna dopo il salvataggio senza reload
- punti di entrata: azione in `CustomerDashboard` e voce nelle Shell di T17
- per il manager mostrare `managerStatus` (`pending`/`approved`) come nota nella pagina

Nota: `managerStatus` c e in `AuthUser` (swagger:1331) e in `User` (swagger:1312); a mancare sono `restaurantId` e `restaurantName`, quindi la riga filiale e riservata al manager solo quando il backend li aggiunge (blocco gia annotato in T6/T17).

### T20 - Flusso di setup al primo avvio

Stato: fatto. Esito: aggiunti controllo iniziale, setup con PIN, visualizzazione credenziali provvisorie e cambio password obbligatorio.

Stato: il backend ha gia le rotte (vedi `backend/routes/setupRoutes.js` e `controllers/setupController.js`): GET `/api/setup/status` con `adminExists` e `setupCompleted`, POST `/api/setup/request-pin` che su IP non locale genera un PIN stampato in console del backend valido 5 minuti (rate limit 5 richieste per 15 minuti), POST `/api/setup` di esecuzione con PIN obbligatorio per IP remoto e bypass su localhost, POST `/api/setup/change-password` per il cambio forzato con flag `mustChangePassword`. Non sono nello swagger, il riferimento e il controller.

Il frontend non le chiama mai: se il sistema parte senza admin, chi raggiunge il sito non sa cosa fare.

Implementazione:

- nuovo `services/setupService.js` con i quattro metodi
- controllo all avvio dell app: una chiamata a `/setup/status`; se `adminExists === false` e `setupCompleted === false` si aprira il percorso `/setup`
- pagina `pages/Setup/SetupPage.jsx`: schermata che spiega che il sistema non ha admin, poi richiede il PIN se `pinRequired === true` (l utente lo legge dalla console del backend, come fa gia il controller), oppure prosegue direttamente su localhost
- wizard di setup: form di creazione admin con email e contatti; le credenziali provvisorie stampate in console devono essere mostrate all utente con istruzioni chiare
- cambio password forzato: dopo il primo login con `mustChangePassword`, intercettare il flag e portare l admin su una schermata di cambio password prima del resto
- `executeSetup` risponde con `data.redirectUrl: '/change-password'` e `mustChangePassword: true` (setupController.js:132): e li che la UI deve portare l admin
- il cambio password passa da `POST /setup/change-password`, protetto da `authMiddleware` e valido solo con `mustChangePassword` attivo (setupRoutes.js:28, setupController.js:158)
- in produzione `POST /setup` risponde 403 se `ALLOW_FIRST_RUN_SETUP !== 'true'` (setupController.js:71): la UI deve trattarlo come stato "setup disabilitato", non come errore generico
- rate limit backend 5 su 15 minuti: la UI non deve permettere retry a raffica senza avviso

Accettazione: installazione da zero in localhost completa senza PIN; da IP esterno il PIN arriva in console e il setup prosegue con verifica.

### T21 - Menu: rimozione hardcode e scelta del ristorante

Stato: fatto. Esito: rimossi i piatti fittizi, la filiale viene scelta prima del menu e il cambio filiale e bloccato con carrello pieno.

Stato attuale, due problemi:

1. `orderStore.js:14` dichiara `const RECIPES = [...4 piatti...]` come stato iniziale, e lo stesso array si ripete come default prop in `RecipeMatrix.jsx:9` e `SelectionPanel.jsx:13`. Quando la fetch dei piatti fallisce, `MenuPage.jsx:39` mostra l errore `Il database non contiene piatti disponibili` pero lo schermo continua a mostrare i 4 piatti finti di default. L utente vede un menu che non esiste
2. `MenuPage.jsx:40-42`: dopo le due Promise in parallelo la filiale e sempre `restaurantResponse.data[0]`. Prima di ordinare l utente non sceglie il ristorante

Implementazione:

- meccanismo esatto del bug: `MenuPage.jsx:39` lancia prima di `order.setRecipes` (riga 43), quindi lo store resta con `recipes` iniziali = `RECIPES` (orderStore.js:14-19, 27) e `selectedRecipe` = `RECIPES[0]` (riga 28). Ecco perche i piatti finti restano a schermo sotto il messaggio di errore, insieme alla "SMASH CLASSIC" selezionata
- stato iniziale `recipes: []` e `selectedRecipe: null`, niente array di default. `RecipeMatrix` e `SelectionPanel` perdono le default prop e ricevono i dati obbligatori dal chiamante
- riscrivere la copy dell'errore: "Il database non contiene piatti disponibili" e brutta e fuori tono, va resa coerente col resto (es. "nessun piatto disponibile in questa filiale")
- in `MenuPage` mostrare durante il caricamento e lo stato di errore, senza piatti finti; se l elenco vuoto dopo il caricamento e un messaggio dedicato, non una colonna vuota
- scelta filiale prima del menu: schermata con ricerca esistente (`RestaurantSearch.jsx`) o una fase iniziale dentro `MenuPage` finche non si sceglie. Se c e una sola filiale, si seleziona da sola
- la filiale scelta vive in `orderStore` come `selectedRestaurant`, cosi `addCartItem` e il checkout la leggono. Qui si sposa con T13: lo store del ristorante fornira elenco e filtri, la scelta attiva resta nello store dell ordine
- se l utente cambia filiale con carrello non vuoto: avviso di cambio filiale, il carrello non puo mescolare filiali
- senza filiali disponibili non si entra nel menu, con messaggio di riprova

Verifica: con DB pieno si sceglie filiale poi si vede il menu di quella filiale; senza piatti niente griglia inventata, messaggio coerente.

### T22 - Polish generale e dinamicita

Stato: fatto. Esito: aggiunti transizione tra route, focus coerenti, feedback animato dello scanner e stato attivo delle ricette.

Sintomo: le pagine si alternano senza transizioni, mancano skeletons, i toast esistono nel store ma quasi nessuno li usa, e molto style e inline nei componenti (per esempio `AuthForm.jsx` alle righe 148 e 196-212, `SelectionPanel.jsx`, blocchi in `AppRouter.jsx` e `RecipeMatrix.jsx`). L app funziona ma le pagine sembrano incollate.

Implementazione:

- transizione pagina: al cambio route una classe fade/slide con `transition` di circa 200ms sulla root della pagina, via key nel router. Basta il CSS
- skeleton: durante il caricamento, skeleton per la griglia `RecipeMatrix`, `OrderBuffer` e card delle dashboard, cosi il layout non salta quando arrivano i dati
- centralizzare gli inline style in classi di `terminal.css` o variabili `tokens.css`: i file indicati sopra prima, poi una passata sugli altri
- Tailwind v4 e gia attivo (`@import "tailwindcss"` in `index.css`, plugin in `vite.config.mjs`): le utility sono disponibili. Scegliere per componente tra utility Tailwind e classi di `terminal.css`, senza mescolare i due stili nella stessa regola
- unificare `html`: `main.jsx:17` fa `htm.bind(h)` in locale mentre i componenti importano da `utils/htm.js`. Due configurazioni diverse dello stesso binding sono un rischio, `main.jsx` deve usare quella condivisa
- standardizzare i toast: azioni riuscite e info in toast via `uiStore.showToast`, errori legati a una form restano inline con `FormMessage`
- micro-interazioni: hover e focus-visible coerenti su tutti i `terminal-button`, stato active di `RecipeButton` evidente, `pulse` del machine-state reale
- `BurgerScanner`: aggiungere un feedback animato sulla ricetta selezionata, non un rendering statico
- keyboard: tab coerente in ogni pagina, footer che non menta sui comandi reali

Accettazione: navigazione con transizioni, nessun salto di layout al caricamento, inline styles residui solo dove servono davvero.

## 12. Ordine consigliato (aggiornato)

La vecchia lista era incentrata sui task UX/UI (T14-T22), ora tutti fatti: resta valida solo come storico. Il lavoro che resta, in ordine:

1. T6 (verifica dei campi con risposte reali) e lo sblocco `user.restaurantId`: richiede il backend attivo, senza quello non si chiude
2. T12 (UI mancanti: gestione filiale e menu del manager, metodi di pagamento, azioni profilo come `deleteAccount`) - dipende da T6 per i campi utente
3. T13 (architettura: collegare `restaurantStore`, decidere il destino di `orderService.createOrder`)

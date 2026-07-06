# Data Model

Questa sezione descrive come il domain model di FastFood viene tradotto in collezioni e documenti MongoDB.  
L'obiettivo è mantenere lo schema coerente con i principali pattern di accesso dell'applicazione, preservando una chiara separazione tra dati condivisi, dati riutilizzabili e dati specifici dell'ordine.

## 1. Collezioni principali

| Collezione | Descrizione sintetica |
|---|---|
| **users** | Clienti, manager e admin |
| **restaurants** | Filiali della catena |
| **dishes** | Piatti standard e personalizzati |
| **ingredients** | Ingredienti riutilizzabili tra piatti |
| **orders** | Ordini (bozza e confermati), con righe ordine e consegna |
| **paymentMethods** | Metodi di pagamento dei clienti |

## 2. Progettazione delle collezioni

### 2.1 users
La collezione `users` memorizza tutti gli utenti dell'applicazione, inclusi clienti, manager e admin.

- Un campo `role` distingue la tipologia di utente.
- Gli attributi comuni (nome, cognome, email, password, indirizzo) sono memorizzati nello stesso documento.

### 2.2 restaurants
La collezione `restaurants` memorizza le filiali della catena.

- Ogni ristorante è associato a un solo manager tramite un riferimento al relativo documento utente.

### 2.3 dishes
La collezione `dishes` memorizza sia i piatti standard della catena sia quelli personalizzati di uno specifico ristorante.

- Un flag identifica se un piatto è personalizzato oppure no.
- Un riferimento opzionale al ristorante viene usato solo nel caso dei piatti personalizzati.

### 2.4 ingredients
La collezione `ingredients` memorizza gli ingredienti utilizzati per comporre i piatti.

- Ogni ingrediente può essere associato a più piatti.
- La relazione è gestita tramite riferimenti anziché tramite embedding completo.

### 2.5 orders
La collezione `orders` memorizza sia gli ordini in stato di bozza sia quelli confermati.

- Ogni ordine contiene un array embedded di `orderItems`, poiché le righe d'ordine sono strettamente legate all'ordine stesso e vengono normalmente lette e aggiornate insieme.
- Un `orderItem` memorizza il piatto selezionato, la quantità e il prezzo unitario al momento dell'acquisto.
- L'ordine memorizza inoltre il proprio stato corrente, la modalità dell'ordine e l'importo totale.

#### 2.5.1 delivery (subdocument opzionale)
Le informazioni di consegna sono incorporate all'interno del documento `orders` come sottodocumento opzionale.

- Questa scelta è adatta perché la consegna esiste solo per gli ordini a domicilio e non deve vivere in modo indipendente rispetto all'ordine.

### 2.6 paymentMethods
La collezione `paymentMethods` memorizza i metodi di pagamento associati ai clienti.

- Ogni metodo di pagamento contiene un riferimento al cliente proprietario tramite l'identificativo utente.

## 3. Embedding e referencing

Il data model utilizza sia embedding sia referencing:

| Strategia | Quando si applica | Esempi nel progetto |
|---|---|---|
| **Embedding** | Dati che condividono lo stesso ciclo di vita del documento padre | `orderItems` e `delivery` dentro `orders` |
| **Referencing** | Dati riutilizzabili o condivisi | ristorante ↔ manager, piatto ↔ ingredienti, cliente ↔ metodi di pagamento |

Questo approccio riduce la duplicazione non necessaria e permette allo stesso tempo di avere i dati dell'ordine più frequentemente utilizzati disponibili in un unico documento.

## 4. Scelte di modellazione

Nel data model sono state adottate le seguenti scelte:

- La collezione `orders` rappresenta anche il carrello in stato di bozza, quindi non è necessaria una collezione separata per il carrello.
- Il sottodocumento `delivery` è presente solo quando la modalità dell'ordine è a domicilio.
- I piatti standard e i piatti personalizzati sono memorizzati nella stessa collezione, utilizzando un flag per distinguerli.
- Gli ingredienti sono modellati come collezione separata, poiché sono condivisi tra più piatti e possono essere riutilizzati nei filtri legati agli allergeni.

## 5. Confini del modello

Questo data model non include route API, logica di business o comportamento del frontend.  
Questi aspetti appartengono alle fasi successive di progettazione architetturale e implementazione.

## 6. Note finali

Lo schema è stato progettato per essere coerente con i requisiti del progetto e con i pattern di accesso attesi.  
In particolare, privilegia l'embedding per i dati legati all'ordine e il referencing per gli elementi di dominio riutilizzabili.

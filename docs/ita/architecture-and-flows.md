# Architettura e Flussi

## Indice

1. [Obiettivo del documento](#obiettivo-del-documento)
2. [Panoramica dell'architettura](#panoramica-dellarchitettura)
3. [Frontend](#frontend)
4. [Backend](#backend)
5. [Integrazione con MongoDB](#integrazione-con-mongodb)
6. [Servizio esterno: OpenStreetMap](#servizio-esterno-openstreetmap)
7. [Flussi principali](#flussi-principali)
8. [Diagrammi di riferimento](#diagrammi-di-riferimento)
9. [Relazione con gli altri documenti](#relazione-con-gli-altri-documenti)
10. [Confini del documento](#confini-del-documento)

---

## Obiettivo del documento

Questo documento descrive l'architettura ad alto livello del progetto **FastFood**: come frontend, backend, database e servizi esterni collaborano tra loro.
Fa da ponte tra i requisiti (`requirements.md`), il modello dei dati (`data-model.md`) e l'implementazione futura del codice.

---

## Panoramica dell'architettura

FastFood è una **web application client-server** composta da tre componenti principali e un servizio esterno di supporto.

| Componente | Tecnologia | Ruolo |
|---|---|---|
| Frontend | HTML5, CSS3, Bootstrap, JavaScript | Interfaccia utente e interazione con l'API |
| Backend | Node.js + Express | Logica applicativa ed esposizione delle API REST |
| Database | MongoDB | Persistenza dei dati |
| Servizio esterno | API OpenStreetMap | Calcolo distanze per le consegne a domicilio |

---

## Frontend

Il frontend gestisce interfaccia utente e presentazione dei contenuti.

- **HTML** per la struttura delle pagine.
- **CSS + Bootstrap** per stile e responsività.
- **JavaScript** per la logica lato client e le chiamate `fetch` verso le API REST.

Funzionalità principali offerte all'utente:

- registrazione e login;
- consultazione di ristoranti e menu;
- composizione e conferma degli ordini;
- monitoraggio dello stato degli ordini;
- viste dedicate per Cliente, Manager e Admin.

---

## Backend

Il backend implementa la logica applicativa ed espone un insieme di **API REST** documentate con **Swagger/OpenAPI**.

Responsabilità principali:

- autenticazione e autorizzazione degli utenti (per ruolo: Cliente, Manager, Admin);
- gestione di utenti, ristoranti, piatti e ordini;
- aggiornamento dello stato degli ordini;
- gestione delle consegne a domicilio;
- produzione di dati aggregati per dashboard e statistiche.

---

## Integrazione con MongoDB

MongoDB è il livello di persistenza del sistema. La modellazione segue quanto definito in `data-model.md`:

- **Embedded**: dati legati al ciclo di vita dell'ordine (righe ordine, consegna).
- **Referenced**: dati riutilizzabili o condivisi (utenti, ristoranti, piatti, ingredienti).

Questo equilibrio tra embedding e referencing riduce la duplicazione mantenendo comunque un accesso rapido ai dati più consultati.

---

## Servizio esterno: OpenStreetMap

Per gli ordini con consegna a domicilio, il backend interroga le **API di OpenStreetMap** per stimare la distanza tra la filiale e l'indirizzo di consegna.
La distanza ottenuta determina il costo di consegna, che viene salvato nell'ordine.

---

## Flussi principali

I flussi descrivono l'interazione tra utente, frontend, backend, database e servizio esterno.

### 1. Registrazione e login

1. Il Cliente o il Manager invia i propri dati tramite un form del frontend.
2. Il backend valida i dati, effettua l'hashing della password e crea il documento in `users`.
3. Se l'utente è un Manager, l'account viene creato con stato "in attesa di approvazione" e non può ancora gestire una filiale.
4. Al login, il backend verifica le credenziali ed emette un token di sessione/JWT usato per autorizzare le richieste successive.

### 2. Consultazione ristoranti e piatti

1. Il frontend richiama le API REST per ottenere l'elenco dei ristoranti (`restaurants`) e dei relativi piatti (`dishes`).
2. Il backend applica eventuali filtri di ricerca (nome, città, ingrediente, allergene) direttamente nella query MongoDB.
3. I risultati vengono restituiti al frontend e mostrati al Cliente nelle relative viste.

### 3. Composizione e conferma dell'ordine

1. Il Cliente seleziona uno o più piatti dal menu di un ristorante; ogni selezione viene aggiunta a un ordine in stato di bozza (`orders`, con `orderItems` embedded).
2. Il frontend calcola e mostra i totali parziali e finali in base ai dati ricevuti dal backend.
3. Il Cliente sceglie la modalità di completamento (ritiro in sede o consegna a domicilio) e conferma l'ordine.
4. Il backend valida l'ordine, genera il codice alfanumerico identificativo e imposta lo stato a `ordinato`.

### 4. Gestione della consegna a domicilio

1. Se la modalità scelta è consegna a domicilio, il Cliente fornisce l'indirizzo di destinazione.
2. Il backend richiama le API di OpenStreetMap per stimare la distanza tra la filiale e l'indirizzo.
3. Il costo di consegna viene calcolato in base alla distanza e salvato nel sottodocumento `delivery` dell'ordine.
4. Alla ricezione, il Cliente conferma la consegna e lo stato dell'ordine passa da `in consegna` a `consegnato`.

### 5. Aggiornamento stato ordine da parte del Manager

1. Il Manager visualizza dalla propria dashboard gli ordini ricevuti dalla filiale.
2. Il Manager aggiorna lo stato dell'ordine seguendo il flusso previsto per la modalità scelta (ritiro o consegna a domicilio).
3. Il backend persiste l'aggiornamento e il Cliente può vedere il nuovo stato dal proprio storico ordini.

### 6. Gestione amministrativa di filiali e manager da parte dell'Admin

1. L'Admin visualizza gli account Manager in attesa di approvazione e le richieste di apertura di nuove filiali.
2. L'Admin approva o rifiuta un account Manager, oppure crea/chiude una filiale.
3. Il backend aggiorna lo stato dell'utente/ristorante coinvolto e rende disponibili le relative funzionalità.

---

## Diagrammi di riferimento

Attualmente la documentazione include il diagramma del modello di dominio nella cartella `docs/ita/diagrams/`:

| Diagramma | File | Descrizione |
|---|---|---|
| Domain model | `docs/ita/diagrams/fastfood-domain-model.*` | Rappresentazione delle principali entità del sistema e delle loro relazioni |

---

## Relazione con gli altri documenti

| Documento | Contenuto |
|---|---|
| `requirements.md` | Cosa il sistema deve fare |
| `data-model.md` | Come i dati sono organizzati in MongoDB |
| `architecture-and-flows.md` | Come i componenti collaborano per realizzare le funzionalità |

---

## Confini del documento

Questo file **non** descrive:

- il dettaglio dei singoli endpoint REST (payload, status code) — vedi documentazione Swagger;
- la struttura interna completa delle cartelle di progetto — appartiene alla fase di implementazione.

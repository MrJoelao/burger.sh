# Architettura e Flussi

## Indice

1. [Obiettivo del documento](#1-obiettivo-del-documento)
2. [Panoramica dell'architettura](#2-panoramica-dellarchitettura)
3. [Frontend](#3-frontend)
4. [Backend](#4-backend)
5. [Integrazione con MongoDB](#5-integrazione-con-mongodb)
6. [Servizio esterno: OpenStreetMap](#6-servizio-esterno-openstreetmap)
7. [Autenticazione e sessione](#7-autenticazione-e-sessione)
8. [Flussi principali](#8-flussi-principali)
9. [Diagrammi di riferimento](#9-diagrammi-di-riferimento)
10. [Relazione con gli altri documenti](#10-relazione-con-gli-altri-documenti)
11. [Confini del documento](#11-confini-del-documento)

---

## 1. Obiettivo del documento

Questo documento descrive l'architettura ad alto livello del progetto **FastFood**: come frontend, backend, database e servizi esterni collaborano tra loro.
Fa da ponte tra i requisiti (`requirements.md`), il modello dei dati (`data-model.md`) e l'implementazione futura del codice.

---

## 2. Panoramica dell'architettura

FastFood è una **web application client-server** composta da tre componenti principali e un servizio esterno di supporto.

| Componente | Tecnologia | Ruolo |
|---|---|---|
| Frontend | HTML5, CSS3, Bootstrap, JavaScript | Interfaccia utente e interazione con l'API |
| Backend | Node.js + Express | Logica applicativa ed esposizione delle API REST |
| Database | MongoDB | Persistenza dei dati |
| Servizio esterno | API OpenStreetMap | Calcolo distanze per le consegne a domicilio |

---

## 3. Frontend

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

## 4. Backend

Il backend implementa la logica applicativa ed espone un insieme di **API REST** documentate con **Swagger/OpenAPI**.

Responsabilità principali:

- autenticazione e autorizzazione degli utenti (per ruolo: Cliente, Manager, Admin);
- gestione di utenti, ristoranti, piatti e ordini;
- aggiornamento dello stato degli ordini;
- gestione delle consegne a domicilio;
- produzione di dati aggregati per dashboard e statistiche.

---

## 5. Integrazione con MongoDB

MongoDB è il livello di persistenza del sistema. La modellazione segue quanto definito in `data-model.md`:

- **Embedded**: dati legati al ciclo di vita dell'ordine (righe ordine, consegna).
- **Referenced**: dati riutilizzabili o condivisi (utenti, ristoranti, piatti, ingredienti).

Questo equilibrio tra embedding e referencing riduce la duplicazione mantenendo comunque un accesso rapido ai dati più consultati.

---

## 6. Servizio esterno: OpenStreetMap

Per gli ordini con consegna a domicilio, il backend interroga le **API di OpenStreetMap** per stimare la distanza tra la filiale e l'indirizzo di consegna.
La distanza ottenuta determina il costo di consegna, che viene salvato nell'ordine.

---

## 7. Autenticazione e sessione

L'autenticazione degli utenti (Cliente, Manager, Admin) segue un flusso basato su token, descritto in dettaglio nel flusso "Registrazione e login" (sezione 8.1).

- Al login, il backend verifica le credenziali e, se corrette, emette un token di sessione/JWT.
- Il token viene incluso dal frontend in ogni richiesta successiva verso le API protette, tipicamente nell'header `Authorization`.
- Il backend valida il token a ogni richiesta e ne deriva ruolo e identità dell'utente per applicare i controlli di autorizzazione.
- Un Manager con `managerStatus: "pending"` può autenticarsi, ma le funzionalità di gestione filiale restano bloccate fino all'approvazione da parte di un Admin.

Il dettaglio implementativo del meccanismo di token (formato, scadenza, refresh) è demandato alla fase di implementazione e non è oggetto di questo documento.

---

## 8. Flussi principali

I flussi descrivono l'interazione tra utente, frontend, backend, database e servizio esterno.

### 8.1 Registrazione e login

1. Il Cliente o il Manager invia i propri dati tramite un form del frontend.
2. Il backend valida i dati, effettua l'hashing della password e crea il documento in `users`.
3. Se l'utente è un Manager, l'account viene creato con `managerStatus: "pending"` e non può ancora gestire una filiale.
4. Al login, il backend verifica le credenziali ed emette un token di sessione/JWT usato per autorizzare le richieste successive (vedi sezione 7).

### 8.2 Consultazione ristoranti e piatti

1. Il frontend richiama le API REST per ottenere l'elenco dei ristoranti (`restaurants`) e dei relativi piatti (`dishes`).
2. Il backend applica eventuali filtri di ricerca (nome, città, ingrediente, allergene) direttamente nella query MongoDB.
3. I risultati vengono restituiti al frontend e mostrati al Cliente nelle relative viste.

### 8.3 Composizione e conferma dell'ordine

1. Il Cliente seleziona uno o più piatti dal menu di un ristorante; ogni selezione viene aggiunta a un ordine in stato di bozza (`orders`, con `orderItems` embedded).
2. Il frontend calcola e mostra i totali parziali e finali in base ai dati ricevuti dal backend.
3. Il Cliente sceglie la modalità di completamento (ritiro in sede o consegna a domicilio) e conferma l'ordine.
4. Il backend valida l'ordine, genera il codice alfanumerico identificativo e imposta lo stato a `ordinato`.

### 8.4 Gestione della consegna a domicilio

1. Se la modalità scelta è consegna a domicilio, il Cliente fornisce l'indirizzo di destinazione.
2. Il backend richiama le API di OpenStreetMap per stimare la distanza tra la filiale e l'indirizzo.
3. Il costo di consegna viene calcolato in base alla distanza e salvato nel sottodocumento `delivery` dell'ordine.
4. Alla ricezione, il Cliente conferma la consegna e lo stato dell'ordine passa da `in consegna` a `consegnato`.

### 8.5 Aggiornamento stato ordine da parte del Manager

1. Il Manager visualizza dalla propria dashboard gli ordini ricevuti dalla filiale.
2. Il Manager aggiorna lo stato dell'ordine seguendo il flusso previsto per la modalità scelta (ritiro o consegna a domicilio), come definito in `data-model.md`.
3. Il backend persiste l'aggiornamento e il Cliente può vedere il nuovo stato dal proprio storico ordini.

### 8.6 Gestione amministrativa di filiali e manager da parte dell'Admin

1. L'Admin visualizza gli account Manager con `managerStatus: "pending"` e le richieste di apertura di nuove filiali.
2. L'Admin approva o rifiuta un account Manager, oppure crea/chiude una filiale.
3. Il backend aggiorna lo stato dell'utente/ristorante coinvolto e rende disponibili le relative funzionalità.

---

## 9. Diagrammi di riferimento

Attualmente la documentazione include il diagramma del modello di dominio nella cartella `docs/ita/diagrams/`:

| Diagramma | File | Descrizione |
|---|---|---|
| Domain model | `docs/ita/diagrams/fastfood-domain-model.*` | Rappresentazione delle principali entità del sistema e delle loro relazioni |

> **Nota**: un diagramma di sequenza dedicato al flusso di autenticazione (sezione 7 e 8.1) non è ancora presente e potrà essere aggiunto in una versione successiva della documentazione.

---

## 10. Relazione con gli altri documenti

| Documento | Contenuto |
|---|---|
| `requirements.md` | Cosa il sistema deve fare |
| `data-model.md` | Come i dati sono organizzati in MongoDB |
| `architecture-and-flows.md` | Come i componenti collaborano per realizzare le funzionalità |

---

## 11. Confini del documento

Questo file **non** descrive:

- il dettaglio dei singoli endpoint REST (payload, status code) — vedi documentazione Swagger;
- la struttura interna completa delle cartelle di progetto — appartiene alla fase di implementazione.

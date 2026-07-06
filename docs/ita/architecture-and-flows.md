# Architettura e Flussi

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

I flussi descrivono l'interazione tra utente, frontend, backend, database e servizio esterno:

1. **Registrazione e login**
2. **Consultazione ristoranti e piatti**
3. **Composizione e conferma dell'ordine**
4. **Gestione della consegna a domicilio**
5. **Aggiornamento stato ordine da parte del Manager**
6. **Gestione amministrativa di filiali e manager da parte dell'Admin**

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

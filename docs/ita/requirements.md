## 1. Obiettivo del progetto

Il progetto ha come obiettivo la realizzazione di un'applicativo web per la gestione dell'ordinazione online all'interno di una catena di ristoranti fast food.  
La piattaforma deve permettere agli utenti di interagire con i ristoranti tramite funzionalità di registrazione, consultazione del menu, creazione di ordini, gestione delle consegne e visualizzazione delle informazioni principali del proprio account. 

Il sistema deve poter gestire i seguenti quattro macro-scenari principali:
- gestione del profilo utente.
- gestione del ristorante.
- gestione degli ordini.
- gestione delle consegne.

## 2. Attori del sistema

### Attori previsti:

- **Cliente**
- **Manager** (Ristoratore)

### Estensione proposta

- **Admin**, inteso come amministratore centrale della piattaforma o della catena, con la possibilità di gestire ogni ristorante della catena.

Anche se non esplicitamente richiesto dalla traccia, l'introduzione dell'Admin viene considerata come scelta progettuale per rappresentare meglio un contesto di franchising e per separare la gestione globale della piattaforma dalla gestione della singola filiale.  
In particolare, l'Admin può supervisionare l'attivazione delle filiali e approvare gli account dei Manager registrati sulla piattaforma.

### Permessi preliminari dei ruoli

#### Cliente
- registrarsi e autenticarsi;
- modificare i propri dati;
- eliminare il proprio account;
- consultare i ristoranti;
- consultare i piatti;
- effettuare ordini;
- visualizzare ordini attuali e passati;
- confermare la ricezione dell'ordine in caso di consegna a domicilio.

#### Manager
- registrarsi e autenticarsi.
- modificare i propri dati.
- eliminare il proprio account, chiudendo la filiale o cambiando gestore della stessa.
- gestire i dati del proprio ristorante.
- gestire il menu del proprio ristorante.
- visualizzare e aggiornare lo stato degli ordini.
- visualizzare statistiche relative alla propria filiale.

#### Admin/CEO (scelta progettuale)
- approvare gli account dei Manager registrati;
- creare una filiale.
- visualizzare tutte le filiali.
- monitorare l'intera piattaforma.
- accedere a informazioni aggregate su utenti, ristoranti e ordini.
- intervenire su dati globali del sistema.

## 3. Gestione del profilo utente

Il sistema deve prevedere una fase di registrazione e login per gli utenti.  
Nel caso del Cliente, l'account è immediatamente utilizzabile dopo la registrazione.  
Nel caso del Manager, la registrazione è consentita ma l'account deve essere approvato da un Admin prima di poter gestire una filiale.

### Dati utente previsti

Per ciascun utente il sistema dovrà gestire:
- nome.
- cognome.
- email.
- password.
- indirizzo.
- tipologia di account.
- eventuali preferenze.
- eventuali metodi di pagamento associati.

### Funzionalità del profilo

L'utente deve poter:
- visualizzare i propri dati.
- modificare i propri dati personali.
- cancellare il proprio account.

### Preferenze utente

Il sistema può associare al cliente alcune preferenze, al momento della registrazione e durante l'uso del sistema, per personalizzare i servizi, ad esempio:
- tipologie di prodotti preferiti.
- offerte speciali mostrate in evidenza.
- preferenze legate all'esperienza d'acquisto.

> TODO: specificare meglio quali preferenze saranno effettivamente implementate.

## 4. Gestione del ristorante

La gestione del ristorante riguarda principalmente il ruolo del Manager, che amministra una singola filiale della catena.

### Informazioni del ristorante

Per ogni ristorante dovranno essere gestite le seguenti informazioni:
- nome del ristorante.
- indirizzo.
- luogo / città.
- numero di telefono.
- partita IVA.
- proprietario / Manager associato.

### Gestione del menu

Il Manager deve poter:
- aggiungere piatti al proprio menu.
- modificare i piatti presenti.
- rimuovere piatti dal menu.

I piatti comuni per tutti i ristoranti saranno caricati da `meal.json`, disponibile nella fase di setup iniziale del sistema. rappresentano la base comune tra le varie filiali.

### Informazioni dei piatti

Per ogni piatto devono essere gestite informazioni quali:
- nome.
- tipologia.
- prezzo.
- ingredienti.
- foto illustrativa. 

Oltre ai piatti comuni caricati inizialmente, il manager può inserire piatti personalizzati specifici del proprio ristorante. 

### Dashboard del Manager

Si assume che ogni Manager disponga di una dashboard per visualizzare:
- ordini ricevuti.
- ordini in preparazione.
- ordini completati.
- incassi.
- statistiche sui piatti più venduti.
- numero di ordini suddivisi per stato.

## 5. Gestione degli ordini

La gestione degli ordini riguarda le operazioni con cui il cliente seleziona uno o più piatti e conclude l'acquisto. 

### Flusso generale

Il cliente deve poter:
- visualizzare i ristoranti della catena.
- accedere al menu di un ristorante.
- selezionare uno o più piatti.
- aggiungere i piatti al carrello.
- confermare l'ordine. 
- pagare tramite app o contatto fisico alla cassa.
- visualizzare il codice alfanumerico associato all'ordine.

### Carrello

Il sistema deve prevedere un carrello contenente:
- elenco dei piatti selezionati.
- quantità.
- prezzo unitario.
- totale parziale.
- totale finale.

### Dati dell'ordine

Per ogni ordine il sistema dovrà memorizzare almeno:
- cliente associato;
- ristorante associato;
- elenco dei piatti ordinati;
- quantità per ciascun piatto;
- prezzo totale;
- modalità di completamento dell'ordine;
- stato corrente dell'ordine;
- data e ora di creazione;
- eventuale indirizzo di consegna;
- codice identificativo / alfanumerico associato all'ordine.

### Stati dell'ordine

Il flusso di stato previsto per gli ordini è il seguente:
- `ordinato`
- `in preparazione`
- `pronto`
- `in consegna`
- `consegnato`

Nel caso di ritiro in sede, il flusso previsto è:
- `ordinato` → `in preparazione` → `pronto` → `consegnato`

Nel caso di consegna a domicilio, il flusso previsto è:
- `ordinato` → `in preparazione` → `in consegna` → `consegnato`

### Storico acquisti

Il cliente deve poter visualizzare:
- ordini in corso.
- ordini passati.
- dettagli degli acquisti effettuati. 


## 6. Gestione delle consegne

Il sistema deve supportare almeno due modalità di completamento dell'ordine:
- ritiro presso il ristorante.
- consegna a domicilio. 

### Ritiro in sede

Nel caso di ritiro presso il ristorante:
- il sistema deve stimare un tempo di attesa.
- il Manager segnala quando l'ordine è pronto.
- il cliente ritira l'ordine al banco. 

Si suppone di associare all'ordine anche un codice alfanumerico da mostrare al momento del ritiro.

### Consegna a domicilio

Nel caso di consegna a domicilio:
- il cliente inserisce l'indirizzo di consegna;
- il sistema calcola la distanza tra ristorante e destinazione stimandola tramite le API di OpenStreetMap;
- il costo di consegna dipende dalla distanza in km;
- il cliente, alla ricezione dell'ordine, conferma l'avvenuta consegna e l'ordine passa da `in consegna` a `consegnato`.

## 7. Funzionalità di ricerca

La piattaforma deve offrire funzionalità di ricerca su ristoranti e piatti. 

### Ricerca ristoranti
Ricerca per:
- nome del ristorante.
- luogo / città. 
- ristorante che offre un determinato piatto.

### Ricerca piatti
Ricerca per:
- nome.
- tipologia.
- prezzo.
- per ingrediente. 
- per allergie.

> TODO: chiarire come modellare le allergie: lista esplicita nel piatto oppure derivata dagli ingredienti.

## 8. Assunzioni progettuali

Nella fase iniziale vengono assunte le seguenti scelte progettuali:
- il sistema rappresenta una **catena di fast food** composta da più filiali.
- ogni filiale è associata a un singolo Manager responsabile.
- il cliente può interagire con tutte le filiali tramite un'unica piattaforma.
- il ruolo di **Admin** viene introdotto come estensione progettuale per gestire la piattaforma a livello centrale.
- il Manager può registrarsi autonomamente, ma il suo account deve essere approvato da un Admin prima di diventare operativo.
- i dipendenti del ristorante non vengono considerati nel sistema.

## 9. Funzionalità escluse o rinviate

Per semplicità progettuale, nella prima versione non vengono considerate:
- gestione dettagliata dei dipendenti.
- gestione del magazzino.
- gestione delle materie prime.
- gestione del personale di consegna come entità autonoma.
- contabilità completa del ristorante.

## 10. Vincoli tecnici
- Frontend: HTML5 + CSS3 + JS
- Backend: Node.js + MongoDB
- API: REST, documentate con Swagger

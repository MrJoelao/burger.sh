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

- **Admin**, inteso come amministratore centrale della piattaforma o della catena, con la possibilita di gestire ogni ristorante della catena.

Anche se non esplicitamente richiesto dalla traccia, l'introduco come scelta progettuale per rappresentare meglio un contesto di franchising e per separare la gestione globale della piattaforma dalla gestione della singola filiale.
in aggiunta, suppongo che sia lui come CEO della azienda a registrare le filiali e i singoli manager.

### Permessi preliminari dei ruoli

#### Cliente
- registrarsi e autenticarsi.
- modificare i propri dati.
- eliminare il proprio account.
- consultare i ristoranti.
- consultare i piatti.
- effettuare ordini.
- visualizzare ordini attuali e passati.
- gestire i metodi di pagamento.
- confermare la ricezione dell'ordine in caso di consegna a domicilio.

#### Manager
- autenticarsi.
- modificare i propri dati.
- eliminare il proprio account, chiudendo la filiale o cambiando gestore della stessa.
- gestire i dati del proprio ristorante.
- gestire il menu del proprio ristorante.
- visualizzare e aggiornare lo stato degli ordini.
- visualizzare statistiche relative alla propria filiale.

#### Admin/CEO (scelta progettuale)
- registrare i manager
- creare una filiale
- visualizzare tutte le filiali.
- monitorare l'intera piattaforma.
- accedere a informazioni aggregate su utenti, ristoranti e ordini.
- intervenire su dati globali del sistema.


## 3. Gestione del profilo utente

Il sistema deve prevedere una fase di registrazione e login per gli utenti.
Supponendo l'estitenza dell'admin, contrariamente a quanto richiesto, il manager non avrà la possibilità di registrarsi quanto tale ma dovrà necessariamente essere aggiunto dall'admin che sarà lui a gestire i manager delle filiali

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

Il sistema può associare al cliente alcune preferenze, al momento della registrazine e durante l'uso del sistema, per personalizzare i servizi, ad esempio:
- tipologie di prodotti preferiti.
- offerte speciali mostrate in evidenza.
- preferenze legate all'esperienza d'acquisto.

> TODO: specificare meglio quali preferenze saranno effettivamente implementate.


## 4. Gestione del ristorante

La gestione del ristorante riguarda principalmente il ruolo del Manager, che amministra una singola o più filiali della catena.

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
i piatti comuni per tutti i ristoranti saranno caricati da `meal.json`, modificabile dall'admin della catena. rappresentano i piatti comuni tra le varie filiali. 

### Informazioni dei piatti

Per ogni piatto devono essere gestite informazioni quali:
- nome.
- tipologia.
- prezzo.
- ingredienti.
- foto illustrativa. 
- 
Oltre ai piatti comuni caricati inizialmente, il manager può inserire piatti personalizzati specifici del proprio ristorante. 

### Dashboard del Manager

Suppongo che ogni Manager disponga di una dashboard per visualizzare:
- ordini ricevuti.
- ordini in preparazione.
- ordini completati.
- incassi (con costi, ricavi e l'utile).
- statistiche sui piatti più venduti.


## 5. Gestione degli ordini

La gestione degli ordini riguarda le operazioni con cui il cliente seleziona uno o più piatti e conclude l'acquisto. 

### Flusso generale

Il cliente deve poter:
- visualizzare i ristoranti della catena.
- accedere al menu di un ristorante.
- selezionare uno o più piatti.
- aggiungere i piatti al carrello.
- confermare l'ordine. 
- pagare tramite app o contatto fisico alla cassa
- visualizare il codice alfanumerico associato

### Carrello

Il sistema deve prevedere un carrello contenente:
- elenco dei piatti selezionati.
- quantità.
- prezzo unitario.
- totale parziale.
- totale finale.

### Stati dell'ordine

Il flusso di stato previsto per l'ordine è il seguente:
- `ordinato`
- `in preparazione`
- `in consegna`
- `consegnato`

> Nota: nel caso di ritiro in sede: la schermata avrà le istruzioni per il ritiro al bancone e il flusso salterà lo stato `in consegna`.

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

Suppongo di associare all'ordine anche un codice alfanumerico da mostrare al momento della consegna.

### Consegna a domicilio

Nel caso di consegna a domicilio:
- il cliente inserisce l'indirizzo di consegna.
- il sistema calcola la distanza tra ristorante e destinazione stimandole tramite le API di OpenStreetMap.
- il costo di consegna dipende dalla distanza in km. 
- il cliente, alla ricezione dell'ordine, conferma l'avvenuta consegna sempre tramite codice alfanumerico e l'ordine passa da `in consegna` a `consegnato`. 


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
- ogni filiale è associata a un singolo manager responsabile.
- il cliente può interagire con tutte le filiali tramite un'unica piattaforma.
- il ruolo di **admin** viene introdotto come estensione progettuale per gestire la piattaforma a livello centrale.
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

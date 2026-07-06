Il domain model rappresenta i principali concetti del dominio applicativo di FastFood e le relazioni tra essi.  
Il suo scopo è descrivere il problema in termini concettuali, senza introdurre dettagli implementativi legati a database, API o codice [web:139].

## Entità principali
Le entità individuate nel dominio sono:

- **Utente**, generalizzato nelle sottoentità **Cliente**, **Manager** e **Admin**.
- **Ristorante**, che rappresenta una filiale della catena.
- **Piatto**, che rappresenta un prodotto ordinabile dal cliente.
- **Ingrediente**, associato ai piatti per descriverne la composizione.
- **Ordine**, che rappresenta sia il carrello in fase di composizione sia l’ordine confermato.
- **Consegna**, presente solo nei casi di ordine a domicilio.
- **RigaOrdine**, che rappresenta i singoli piatti contenuti in un ordine con la relativa quantità.
- **MetodoPagamento**, associato al cliente.

## Relazioni principali
Le principali relazioni modellate sono le seguenti:

- Un **Cliente** può effettuare (cardinalità) **Ordini**.
- Un **Manager** gestisce (cardinalità) un **Ristorante**.
- Un **Ristorante** offre (cardinalità) dei **Piatti**.
- Un **Ordine** è composto da (cardinalità) più **RigheOrdine**.
- Ogni **RigaOrdine** si riferisce a un solo **Piatto**.
- Un **Piatto** contiene (cardinalità) uno o più **Ingredienti**.
- Un **Ordine** può includere una **Consegna** solo nel caso di modalità a domicilio.
- Un **Cliente** può associare (cardinalità) uno o più **MetodiPagamento**.


## Scelte di modellazione
Nel diagramma sono state adottate le seguenti scelte:

- L’entità **Utente** è stata specializzata in **Cliente**, **Manager** e **Admin**, per distinguere in modo chiaro i ruoli del sistema.
- L’entità **Ordine** include anche il concetto di carrello: un ordine non ancora confermato viene rappresentato tramite uno stato iniziale, ad esempio `bozza`.
- L’entità **Consegna** è stata modellata come parte opzionale di **Ordine**, poiché non tutti gli ordini prevedono la consegna a domicilio.
- L’entità **Piatto** include sia i piatti comuni della catena sia quelli personalizzati del singolo ristorante; questa distinzione è rappresentata tramite flag.

## Confini del modello
Nel domain model non sono stati inclusi elementi tecnici o implementativi come collezioni MongoDB, endpoint REST, autenticazione JWT o dettagli di persistenza, perché appartengono a fasi successive della progettazione.

## Assunzioni progettuali
Nel modello sono state assunte alcune scelte progettuali coerenti con i requisiti:
- ogni filiale è gestita da un solo manager;
- l’admin è modellato come ruolo distinto rispetto a cliente e manager;
- il carrello non è stato introdotto come entità autonoma, ma come ordine in stato `bozza`;
- la consegna è prevista solo per gli ordini con modalità a domicilio.
- 
## Note sul diagramma
Le molteplicità delle associazioni sono riportate nel diagramma UML allegato.  
Il diagramma è stato costruito per rappresentare solo i concetti di dominio rilevanti, senza dettagli implementativi.  
Le scelte di modellazione principali riguardano la generalizzazione di Utente, la gestione dell’Ordine come carrello non confermato e la presenza opzionale della Consegna.

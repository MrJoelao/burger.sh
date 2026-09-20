# Scenari di Demo — FastFood

## Indice

1. [Scenario 1: Registrazione nuovo cliente](#1-scenario-1-registrazione-nuovo-cliente)
2. [Scenario 2: Cliente ordina con ritiro in sede](#2-scenario-2-cliente-ordina-con-ritiro-in-sede)
3. [Scenario 3: Cliente ordina con consegna a domicilio](#3-scenario-3-cliente-ordina-con-consegna-a-domicilio)
4. [Scenario 4: Ristoratore aggiunge nuovo piatto](#4-scenario-4-ristoratore-aggiunge-nuovo-piatto)
5. [Scenario 5: Cliente conferma ricezione ordine](#5-scenario-5-cliente-conferma-ricezione-ordine)

---

## 1. Scenario 1: Registrazione nuovo cliente

**Obiettivo:** Dimostrare il flusso completo di registrazione e login di un cliente.

**Passaggi:**

1. Avviare l'applicazione con `npm run demo` (frontend su porta 4173, backend su porta 3000).
2. Aprire il browser e accedere all'URL del frontend.
3. Dalla home page, cliccare su "accedi al terminale" per andare alla pagina di login.
4. Cliccare su "Registrati" per passare alla modalita' registrazione.
5. Compilare il form con:
   - Nome: Mario
   - Cognome: Rossi
   - Email: mario.rossi@example.com
   - Password: password123
   - Indirizzo: Via Roma 1, Milano, 20100
   - Preferenze: selezionare "vegetariano" e "senza_glutine"
6. Cliccare su "Registrati".
7. Verificare il redirect alla home page e la comparsa del nome utente nell'header.
8. Andare alla pagina /profile per verificare che i dati siano stati salvati correttamente.

**Screenshot attesi:**

- screenshot-01-homepage.png (home page con hero section)
- screenshot-02-register.png (form di registrazione compilato)
- screenshot-03-profile-after-register.png (profilo utente dopo la registrazione)

---

## 2. Scenario 2: Cliente ordina con ritiro in sede

**Obiettivo:** Dimostrare il flusso completo di ordinazione con ritiro in sede.

**Passaggi:**

1. Assicurarsi di essere loggati come cliente (vedi Scenario 1).
2. Dalla home page, cliccare su "apri il menu" per andare alla selezione ristorante.
3. Selezionare un ristorante dalla lista (es. "Burger House Duomo").
4. Navigare al menu del ristorante selezionato.
5. Aggiungere alcuni piatti al carrello (es. 2x Cheeseburger, 1x Patatine).
6. Andare alla pagina di pagamento (/orders/payment).
7. Scegliere "ritiro in sede" come modalità.
8. Confermare l'ordine.
9. Verificare la creazione dell'ordine con codice alfanumerico (es. FF-A1B2C3) e stato "ordered".
10. Andare alla pagina /dashboard per verificare che l'ordine appaia nello storico.

**Screenshot attesi:**

- screenshot-04-ristorante-list.png (lista ristoranti con filtri)
- screenshot-05-menu.png (menu del ristorante con piatti disponibili)
- screenshot-06-cart.png (carrello con piatti selezionati)
- screenshot-07-order-confirmed.png (ordine confermato con codice)
- screenshot-08-order-history.png (storico ordini nella dashboard)

---

## 3. Scenario 3: Cliente ordina con consegna a domicilio

**Obiettivo:** Dimostrare il calcolo della distanza e del costo di consegna tramite OpenStreetMap.

**Passaggi:**

1. Assicurarsi di essere loggati come cliente.
2. Seguire i passaggi 2-5 dello Scenario 2 per aggiungere piatti al carrello.
3. Nella pagina di pagamento, scegliere "consegna a domicilio".
4. Inserire un indirizzo di consegna (es. "Via Torino 5, Milano").
5. Ottenere la stima della distanza e del costo di consegna tramite l'endpoint /cart/delivery-estimate.
6. Verificare che i valori di distanceKm e deliveryFee siano popolati correttamente.
7. Confermare l'ordine.
8. Verificare che l'ordine contenga i campi delivery con distanza e costo.
9. Simulare il flusso di stato dal punto di vista del manager:
   - Il manager avanza l'ordine a "preparing"
   - Poi a "on_delivery"
   - Il cliente conferma la ricezione e l'ordine passa a "delivered"

**Screenshot attesi:**

- screenshot-09-checkout-delivery.png (selezione consegna a domicilio)
- screenshot-10-delivery-estimate.png (stima distanza e costo)
- screenshot-11-order-tracking.png (tracciamento stato ordine)

---

## 4. Scenario 4: Ristoratore aggiunge nuovo piatto

**Obiettivo:** Dimostrare la gestione del menu da parte di un manager.

**Passaggi:**

1. Registrare un nuovo manager (login come admin per approvare l'account).
2. Effettuare il login con l'account manager approvato.
3. Navigare alla dashboard manager (/dashboard/manager).
4. Andare alla pagina Menu (/manager/menu).
5. Cliccare su "Aggiungi piatto custom".
6. Compilare il form con:
   - Nome: Burger speciale del Duomo
   - Tipologia: burger
   - Prezzo: 8.90
   - Selezionare ingredienti disponibili (es. manzo, formaggio, pomodoro)
7. Salvare il piatto.
8. Verificare che il piatto appaia nel menu della filiale.
9. Andare alla pagina pubblica del ristorante e verificare che il piatto custom sia visibile.

**Screenshot attesi:**

- screenshot-12-manager-login.png (login manager)
- screenshot-13-manager-menu.png (dashboard menu manager)
- screenshot-14-add-dish-form.png (form aggiunta piatto custom)
- screenshot-15-dish-list.png (lista piatti con nuovo piatto custom)

---

## 5. Scenario 5: Cliente conferma ricezione ordine

**Obiettivo:** Dimostrare il flusso di conferma consegna a domicilio.

**Passaggi:**

1. Assicurarsi di avere un ordine a domicilio nello stato "on_delivery".
2. Effettuare il login come cliente.
3. Andare alla pagina dettaglio ordine (/orders/:orderId).
4. Verificare che l'ordine sia nello stato "on_delivery".
5. Cliccare sul bottone "Conferma ricezione".
6. Verificare che l'ordine passi allo stato "delivered" e che il timestamp di conferma sia registrato.
7. Verificare che l'ordine appaia nello storico come ordine passato.

**Screenshot attesi:**

- screenshot-16-order-on-delivery.png (ordine nello stato on_delivery)
- screenshot-17-confirm-delivery.png (popup/modale di conferma)
- screenshot-18-order-delivered.png (ordine consegnato nello storico)

---

## Note operative

Per eseguire i demo in modalità produzione:

```bash
npm run demo
```

Questo comando:
1. Compila il frontend con `vite build`
2. Avvia il backend in production mode
3. Avvia il frontend preview server sulla porta 4173
4. Seeda il database con ristoranti e manager di esempio (database `burger-demo`)

I manager demo usano la password `DemoPassword123!`.

Per il setup iniziale (creazione primo admin e prima filiale):
1. Accedere a `/setup` e seguire la procedura di configurazione
2. Oppure usare lo script `npm run seed:admin` dal backend

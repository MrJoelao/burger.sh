# Piano di Refactoring Frontend - burger.sh

Questo documento delinea il piano per eliminare la duplicazione di codice nel frontend, unificare i componenti e rendere l'architettura più solida (SOLID) e mantenibile.

## 🛠 Stack Tecnologico
- **Framework**: Preact (senza build step per JSX, usa `htm`)
- **Rendering**: `utils/htm.js` (tag `html`)
- **Stato**: Store custom (es. `authStore.js`, `orderStore.js`)
- **CSS**: Tailwind CSS + Custom CSS (retro/cyberpunk aesthetics)
- **API**: Wrapper custom in `services/api.js`

---

## 🔍 Analisi delle Duplicazioni (Smoking Guns)

### 1. Duplicazione `buildQuery` (Service Layer)
La funzione per costruire query string è duplicata identica in:
- `frontend/src/services/restaurantService.js` (righe 118-125)
- `frontend/src/services/managerAdminService.js` (righe 83-90)

### 2. Duplicazione Campi Form (UI Layer)
Il componente per gestire etichetta + input + errore è duplicato in:
- `frontend/src/pages/Profile/components/ProfileField.jsx`
- `frontend/src/pages/Auth/RegisterWizard.jsx` (componente `Field` interno, righe 67-84)
- Viene ricostruito manualmente in `DishForm.jsx` e `BranchForm.jsx`.

### 3. Pattern dei Form (Comportamento)
I seguenti form seguono lo stesso pattern di stato/validazione/invio:
- `PaymentMethodForm.jsx`
- `DishForm.jsx`
- `BranchForm.jsx`
- `AuthForm.jsx`

### 4. Layout Shells (Struttura)
`AdminShell`, `CustomerShell`, `ManagerShell` e `ProfileShell` condividono la stessa struttura:
- `TitleBar` in alto
- `identity-strip` (sezione con prompt e stamp)
- `footer-status` in basso
La logica di rendering della "identity-strip" è quasi identica tra i file.

### 5. Order List Items
La visualizzazione di un ordine in una lista è duplicata tra:
- `frontend/src/pages/Order/components/OrderListItem.jsx` (Vista cliente)
- `frontend/src/pages/Manager/components/OrderQueue.jsx` (Vista manager, funzione `renderOrder`)

---

## 🚀 Roadmap di Refactoring

### Fase 1: Unificazione FormField (Alta Priorità)
**Obiettivo**: Creare un componente `FormField` atomico.
- **Task**: Creare `frontend/src/components/UI/FormField.jsx`.
- **Dettagli**: Deve supportare `label`, `name`, `value`, `onInput`, `error`, `type`, `placeholder`, `wide` (classe CSS).
- **Consumatori**: Sostituire in `ProfileField`, `RegisterWizard`, `DishForm`, `BranchForm`, `CardFields`.

### Fase 2: Consolidamento Service Layer (Alta Priorità)
**Obiettivo**: Estrarre `buildQuery`.
- **Task**: Spostare `buildQuery` in `frontend/src/services/api.js` e esportarlo.
- **Consumatori**: Aggiornare `restaurantService.js` e `managerAdminService.js`.

### Fase 3: Pattern BaseForm (Media Priorità)
**Obiettivo**: Unificare la logica di gestione stato dei form.
- **Task**: Creare un hook `useForm` o un componente `BaseForm` che gestisca `formData`, `errors` e `handleSubmit`.
- **Consumatori**: Rifattorizzare `DishForm`, `BranchForm`, `PaymentMethodForm`.

### Fase 4: Unificazione OrderItem (Media Priorità)
**Obiettivo**: Un singolo componente per la riga ordine.
- **Task**: Evolvere `OrderListItem.jsx` per accettare "azioni" (bottoni) come children o props.
- **Consumatori**: Usarlo sia in `Dashboard` che in `OrderQueue` del manager.

### Fase 5: Refactoring Layout Shells (Bassa Priorità)
**Obiettivo**: Creare un `BaseShell.jsx`.
- **Task**: Estrarre la struttura comune (TitleBar + identity-strip + footer) in un componente base.
- **Consumatori**: Semplificare `AdminShell`, `CustomerShell`, `ManagerShell`, `ProfileShell`.

---

## 📖 Informazioni per l'AI
- **Directory Root**: `burger.sh/frontend/src`
- **Utility Principale**: `import { html } from '../../utils/htm.js';`
- **Hooks**: Usa `preact/hooks` (`useState`, `useEffect`, `useCallback`).
- **Domain**: Consulta `src/domain/*.js` per le regole di validazione (es. `menu.js`, `branch.js`, `payments.js`).

---
*Documento generato dall'Agente Zed il 19/09/2026*

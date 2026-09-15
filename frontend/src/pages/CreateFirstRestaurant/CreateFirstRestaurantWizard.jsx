/**
 * CreateFirstRestaurantWizard - wizard guidato per la creazione del primo ristorante
 * passo 1: info base (nome, indirizzo, città, telefono, partita IVA)
 * passo 2: riepilogo
 * passo 3: aggiunta piatti custom (opzionale, lista con + per aggiungere)
 * passo 4: schermata di congratulazioni in stile terminale
 */

import { useState } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { TerminalButton } from '../../components/Auth/TerminalButton.jsx';

const STEPS = [
  { eyebrow: 'first restaurant / identity', title: 'IDENTITÀ DELLA FILIALE', subtitle: 'Diamo un nome e una sede al tuo ristorante.' },
  { eyebrow: 'first restaurant / review', title: 'CONTROLLA I DATI', subtitle: 'Verifica che tutto sia corretto prima di procedere.' },
  { eyebrow: 'first restaurant / menu', title: 'IL TUO MENU', subtitle: 'Aggiungi i piatti custom del tuo ristorante. Puoi saltare e aggiungerli dopo.' },
  { eyebrow: 'first restaurant / done', title: 'Tutto pronto!', subtitle: 'La tua filiale è stata creata con successo.' }
];

const INITIAL_VALUES = {
  name: '',
  street: '',
  city: '',
  zip: '',
  phone: '',
  vatNumber: ''
};

const DISH_TYPES = ['burger', 'pizza', 'side', 'drink', 'dessert'];
const DISH_TYPE_LABELS = {
  burger: 'Burger',
  pizza: 'Pizza',
  side: 'Contorno',
  drink: 'Bevanda',
  dessert: 'Dessert'
};

function validateStep(step, values, dishes) {
  const errors = {};

  if (step === 0) {
    if (!values.name.trim()) errors.name = 'Inserisci il nome della filiale';
    else if (values.name.trim().length < 2) errors.name = 'Almeno 2 caratteri';

    if (!values.street.trim()) errors.street = 'Inserisci l\'indirizzo';
    else if (values.street.trim().length < 5) errors.street = 'Indirizzo troppo corto';

    if (!values.city.trim()) errors.city = 'Inserisci la città';
    else if (values.city.trim().length < 2) errors.city = 'Almeno 2 caratteri';

    if (!values.phone.trim()) errors.phone = 'Inserisci il telefono';
    else if (!/^\+?[0-9\s\-()]+$/.test(values.phone)) errors.phone = 'Telefono non valido';

    if (!values.vatNumber.trim()) errors.vatNumber = 'Inserisci la partita IVA';
  }

  // Validazione piatti: solo se ce ne sono
  if (step === 2 && dishes.length > 0) {
    dishes.forEach((dish, index) => {
      if (!dish.name.trim()) errors[`dish_${index}_name`] = 'Nome richiesto';
      if (!dish.price || isNaN(dish.price) || parseFloat(dish.price) <= 0) {
        errors[`dish_${index}_price`] = 'Prezzo valido richiesto';
      }
    });
  }

  return errors;
}

function Field({ label, name, value, onInput, error, type = 'text', placeholder, wide = false, autocomplete }) {
  return html`
    <div class=${wide ? 'wizard-field wide' : 'wizard-field'}>
      <label>
        ${label}
        <input
          type=${type}
          name=${name}
          autocomplete=${autocomplete}
          placeholder=${placeholder}
          value=${value}
          onInput=${onInput}
          aria-invalid=${Boolean(error)}
          aria-describedby=${error ? `${name}-error` : undefined}
        />
      </label>
      ${error && html`<span class="form-message" id=${`${name}-error`}>${error}</span>`}
    </div>
  `;
}

export function CreateFirstRestaurantWizard({
  onSubmit = () => {},
  loading = false,
  error = '',
  user = null
}) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(INITIAL_VALUES);
  const [dishes, setDishes] = useState([]);
  const [errors, setErrors] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDish, setNewDish] = useState({ name: '', description: '', price: '', type: 'burger' });

  const update = (field, value) => {
    setValues(previous => ({ ...previous, [field]: value }));
    if (errors[field]) setErrors(previous => ({ ...previous, [field]: '' }));
  };

  const updateNewDish = (field, value) => {
    setNewDish(previous => ({ ...previous, [field]: value }));
    const errorKey = `dish_new_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  };

  const addDish = () => {
    if (!newDish.name.trim() || !newDish.price || parseFloat(newDish.price) <= 0) return;

    setDishes(previous => [...previous, {
      name: newDish.name.trim(),
      description: newDish.description.trim(),
      price: parseFloat(newDish.price),
      type: newDish.type
    }]);

    setNewDish({ name: '', description: '', price: '', type: 'burger' });
    setShowAddForm(false);
    setErrors({});
  };

  const removeDish = (index) => {
    setDishes(previous => previous.filter((_, i) => i !== index));
  };

  const back = () => {
    setErrors({});
    setStep(previous => Math.max(previous - 1, 0));
  };

  const next = async (event) => {
    event.preventDefault();
    const nextErrors = validateStep(step, values, dishes);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (step === STEPS.length - 2) {
      // Last step before congratulations - submit
      const payload = buildPayload(values, dishes);
      await onSubmit(payload);
      setStep(3);
      return;
    }

    setStep(previous => Math.min(previous + 1, STEPS.length - 1));
  };

  const current = STEPS[step];

  return html`
    <form class="auth-form register-wizard" onSubmit=${next} novalidate>
      <div class="wizard-progress" aria-label="Avanzamento creazione ristorante">
        ${STEPS.map((item, index) => html`
          <span class=${`wizard-progress-step ${index === step ? 'active' : ''} ${index < step ? 'complete' : ''}`}>
            <b>${String(index + 1).padStart(2, '0')}</b> ${item.title.replace('.', '').toLowerCase()}
          </span>
        `)}
      </div>

      <div class="wizard-viewport">
        <section class="wizard-step" key=${step} aria-labelledby="wizard-step-title">
          ${step === 0 && html`
            <p class="wizard-explainer">
              Ciao <b>${user?.name || 'Manager'}</b>, ora creiamo la tua prima filiale.
              Compila i dati sotto per registrare il ristorante.
            </p>
            <div class="wizard-fields two-up">
              <${Field} label="nome filiale" name="name" placeholder="es. Burger House Milano" value=${values.name} error=${errors.name} onInput=${event => update('name', event.target.value)} wide />
              <${Field} label="indirizzo" name="street" autocomplete="street-address" placeholder="Via Roma 1" value=${values.street} error=${errors.street} onInput=${event => update('street', event.target.value)} wide />
              <${Field} label="città" name="city" autocomplete="address-level2" placeholder="Milano" value=${values.city} error=${errors.city} onInput=${event => update('city', event.target.value)} />
              <${Field} label="CAP" name="zip" autocomplete="postal-code" placeholder="20100" value=${values.zip} onInput=${event => update('zip', event.target.value)} />
              <${Field} label="telefono" name="phone" type="tel" autocomplete="tel" placeholder="+39 02 1234567" value=${values.phone} error=${errors.phone} onInput=${event => update('phone', event.target.value)} />
              <${Field} label="partita IVA" name="vatNumber" autocomplete="off" placeholder="IT0000000000" value=${values.vatNumber} error=${errors.vatNumber} onInput=${event => update('vatNumber', event.target.value)} />
            </div>
          `}

          ${step === 1 && html`
            <p class="wizard-explainer">Ecco un riepilogo dei dati che inserirai. Puoi tornare indietro per modificarli.</p>
            <div class="setup-review wizard-review">
              <p><span>nome filiale</span><b>${values.name || '-'}</b></p>
              <p><span>indirizzo</span><b>${values.street || '-'}</b></p>
              <p><span>città</span><b>${values.city || '-'}</b></p>
              <p><span>telefono</span><b>${values.phone || '-'}</b></p>
              <p><span>partita IVA</span><b>${values.vatNumber || '-'}</b></p>
              <p><span>piatti custom</span><b>${dishes.length > 0 ? dishes.length + ' aggiunti' : 'nessuno (puoi aggiungere dopo)'}</b></p>
            </div>
            <p class="wizard-hint">Se qualcosa non va, torna indietro con il pulsante.</p>
          `}

          ${step === 2 && html`
            <p class="wizard-explainer">
              Ora puoi aggiungere piatti custom al menu della tua filiale.
              È opzionale: puoi saltare e aggiungerli dopo dalla dashboard.
            </p>

            ${dishes.length > 0 && html`
              <div class="dish-list">
                <p class="eyebrow">PIATTI AGGIUNTI (${dishes.length})</p>
                ${dishes.map((dish, index) => html`
                  <div class="dish-item" key=${index}>
                    <div class="dish-info">
                      <span class="dish-type badge">${DISH_TYPE_LABELS[dish.type] || dish.type}</span>
                      <span class="dish-name"><b>${dish.name}</b></span>
                      ${dish.description && html`<span class="dish-desc">${dish.description}</span>`}
                      <span class="dish-price">${dish.price.toFixed(2)} €</span>
                    </div>
                    <button type="button" class="dish-remove" onClick=${() => removeDish(index)} aria-label="rimuovi piatto">[ X ]</button>
                  </div>
                `)}
              </div>
            `}

            ${showAddForm && html`
              <div class="dish-add-form">
                <p class="eyebrow">AGGIUNGI NUOVO PIATTO</p>
                <div class="wizard-fields">
                  <${Field} label="nome piatto" name="dishName" placeholder="es. Burger Classico" value=${newDish.name} error=${errors.dish_new_name} onInput=${event => updateNewDish('name', event.target.value)} wide />
                  <${Field} label="descrizione" name="dishDesc" placeholder="Breve descrizione (opzionale)" value=${newDish.description} onInput=${event => updateNewDish('description', event.target.value)} wide />
                  <${Field} label="prezzo (€)" name="dishPrice" type="number" step="0.5" min="0.5" placeholder="8.50" value=${newDish.price} error=${errors.dish_new_price} onInput=${event => updateNewDish('price', event.target.value)} />
                  <label class="wizard-field">
                    <span>tipo piatto</span>
                    <select value=${newDish.type} onChange=${event => updateNewDish('type', event.target.value)}>
                      ${DISH_TYPES.map(type => html`<option value=${type}>${DISH_TYPE_LABELS[type]}</option>`)}
                    </select>
                  </label>
                </div>
                <div class="dish-add-actions">
                  <${TerminalButton} type="button" onClick=${() => { setShowAddForm(false); setErrors({}); }}>[ anulla ]</${TerminalButton}>
                  <${TerminalButton} primary type="button" onClick=${addDish}>[ + ] aggiungi piatto</${TerminalButton}>
                </div>
              </div>
            `}

            ${!showAddForm && dishes.length === 0 && html`
              <div class="dish-empty">
                <p class="eyebrow">nessun piatto aggiunto</p>
                <p class="wizard-hint">I piatti custom possono essere aggiunti dopo dalla dashboard.</p>
              </div>
            `}

            ${!showAddForm && html`
              <div class="dish-add-btn">
                <${TerminalButton} type="button" onClick=${() => setShowAddForm(true)}>[ + ] aggiungi un piatto custom</${TerminalButton}>
              </div>
            `}
          `}

          ${step === 3 && html`
            <div class="congratulations-screen">
              <div class="terminal-header">
                <span class="terminal-title">burger.sh</span>
                <span class="terminal-status">✓ CONNESSO</span>
              </div>
              <div class="terminal-body">
                <pre class="ascii-art" aria-hidden="true">
 ██████╗ ██╗   ██╗███╗   ██╗██╗  ██╗███████╗██████╗
██╔═══██╗██║   ██║████╗  ██║██║ ██╔╝██╔════╝██╔══██╗
██║   ██║██║   ██║██╔██╗ ██║█████╔╝ █████╗  ██║  ██║
██║▄▄ ██║██║   ██║██║╚██╗██║██╔═██╗ ██╔══╝  ██║  ██║
╚██████╔╝╚██████╔╝██║ ╚████║██║  ██╗███████╗██████╔╝
 ╚══▀▀═╝  ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝╚═════╝
                </pre>
                <p class="success-message">
                  <span class="prompt">></span> Filiale creata con successo!<br/>
                  <span class="prompt">></span> Nome: <b>${values.name}</b><br/>
                  <span class="prompt">></span> Indirizzo: <b>${values.street}, ${values.city}</b><br/>
                  ${dishes.length > 0 && html`<span class="prompt">></span> Piatti custom aggiunti: <b>${dishes.length}</b><br/>`}
                  <span class="prompt">></span> Status: <b style=${{ color: 'var(--acid)' }}>ATTIVA</b>
                </p>
                <p class="welcome-text">Benvenuto a bordo, <b>${user?.name}</b>!</p>
              </div>
              <div class="terminal-footer">
                <span>premi INVIO per continuare</span>
                <span class="live-command">manager@burger:~$ <i></i></span>
              </div>
            </div>
          `}
        </section>
      </div>

      ${error && html`<p class="form-message" aria-live="polite">${error}</p>`}

      ${step < 3 && html`
        <div class="wizard-actions">
          ${step > 0
            ? html`<${TerminalButton} type="button" onClick=${back}>[ ← ] indietro<//>`
            : html`<span></span>`}
          <${TerminalButton} primary type="submit" disabled=${loading}>
            [ → ] ${step === 1 ? 'continua' : 'continua'}
          <//>
        </div>
      `}
    </form>
  `;
}

function buildPayload(values, dishes) {
  const payload = {
    name: values.name.trim(),
    address: values.street.trim(),
    city: values.city.trim(),
    phone: values.phone.trim(),
    vatNumber: values.vatNumber.trim()
  };

  if (dishes.length > 0) {
    payload.dishes = dishes.map(d => ({
      name: d.name,
      description: d.description,
      price: d.price,
      type: d.type
    }));
  }

  return payload;
}

export default CreateFirstRestaurantWizard;

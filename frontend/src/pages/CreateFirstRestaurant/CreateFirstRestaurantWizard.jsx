/**
 * CreateFirstRestaurantWizard - wizard guidato per la creazione del primo ristorante
 * passo 1: info base (nome, indirizzo, città, telefono, partita IVA)
 * passo 2: riepilogo
 * passo 3: aggiunta piatto custom (opzionale, può essere saltato)
 * passo 4: schermata di congratulazioni in stile terminale
 */

import { useState } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { TerminalButton } from '../../components/Auth/TerminalButton.jsx';

const STEPS = [
  { eyebrow: 'first restaurant / identity', title: 'IDENTITÀ DELLA FILIALE', subtitle: 'Diamo un nome e una sede al tuo ristorante.' },
  { eyebrow: 'first restaurant / review', title: 'CONTROLLA I DATI', subtitle: 'Verifica che tutto sia corretto prima di procedere.' },
  { eyebrow: 'first restaurant / menu', title: 'AGGIUNGI UN PIATTO?', subtitle: 'Opzionale: crea subito un piatto custom per la tua filiale.' },
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

const INITIAL_DISH = {
  name: '',
  description: '',
  price: '',
  type: 'burger',
  addDish: false
};

function validateStep(step, values, dish) {
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

  if (step === 2 && dish.addDish) {
    if (!dish.name.trim()) errors.dishName = 'Inserisci il nome del piatto';
    if (!dish.price || isNaN(dish.price) || parseFloat(dish.price) <= 0) {
      errors.dishPrice = 'Inserisci un prezzo valido';
    }
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
  onSkipDish = () => {},
  loading = false,
  error = '',
  user = null
}) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(INITIAL_VALUES);
  const [dish, setDish] = useState({ ...INITIAL_DISH });
  const [errors, setErrors] = useState({});

  const update = (field, value) => {
    setValues(previous => ({ ...previous, [field]: value }));
    if (errors[field]) setErrors(previous => ({ ...previous, [field]: '' }));
  };

  const updateDish = (field, value) => {
    setDish(previous => ({ ...previous, [field]: value }));
    const errorKey = `dish${field.charAt(0).toUpperCase() + field.slice(1)}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  };

  const back = () => {
    setErrors({});
    setStep(previous => Math.max(previous - 1, 0));
  };

  const next = (event) => {
    event.preventDefault();
    const nextErrors = validateStep(step, values, dish);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (step === STEPS.length - 2) {
      // Last step before congratulations - submit
      onSubmit(buildPayload(values, dish));
      return;
    }

    setStep(previous => Math.min(previous + 1, STEPS.length - 1));
  };

  const skipDish = () => {
    onSkipDish();
    setStep(3);
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
            </div>
            <p class="wizard-hint">Se qualcosa non va, torna indietro con il pulsante.</p>
          `}

          ${step === 2 && html`
            <p class="wizard-explainer">
              Vuoi aggiungere subito un piatto custom al menu? È opzionale: puoi farlo dopo dalla dashboard.
            </p>
            <div class="wizard-fields">
              <label class="wizard-field">
                <span>aggiungi un piatto custom?</span>
                <select value=${dish.addDish ? 'yes' : 'no'} onChange=${event => updateDish('addDish', event.target.value === 'yes')}>
                  <option value="no">No, salto</option>
                  <option value="yes">Sì, voglio aggiungerne uno</option>
                </select>
              </label>
              ${dish.addDish && html`
                <${Field} label="nome piatto" name="dishName" placeholder="es. Burger Classico" value=${dish.name} error=${errors.dishName} onInput=${event => updateDish('name', event.target.value)} wide />
                <${Field} label="descrizione" name="dishDescription" placeholder="Breve descrizione del piatto" value=${dish.description} onInput=${event => updateDish('description', event.target.value)} wide />
                <${Field} label="prezzo (€)" name="dishPrice" type="number" step="0.5" min="0.5" placeholder="8.50" value=${dish.price} error=${errors.dishPrice} onInput=${event => updateDish('price', event.target.value)} />
                <label class="wizard-field">
                  <span>tipo piatto</span>
                  <select value=${dish.type} onChange=${event => updateDish('type', event.target.value)}>
                    <option value="burger">Burger</option>
                    <option value="pizza">Pizza</option>
                    <option value="side">Contorno</option>
                    <option value="drink">Bevanda</option>
                    <option value="dessert">Dessert</option>
                  </select>
                </label>
              `}
            </div>
            <div class="wizard-actions" style=${{ marginTop: '24px' }}>
              <${TerminalButton} type="button" onClick=${skipDish}>[ SALTA ] vai avanti<//>
              <${TerminalButton} primary type="button" onClick=${next} disabled=${loading}>
                [ CONFERMA ] ${dish.addDish ? 'crea piatto e continua' : 'continua senza piatto'}
              <//>
            </div>
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
                  ${dish.addDish && html`<span class="prompt">></span> Piatto custom aggiunto: <b>${dish.name}</b><br/>`}
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

function buildPayload(values, dish) {
  const payload = {
    name: values.name.trim(),
    address: values.street.trim(),
    city: values.city.trim(),
    phone: values.phone.trim(),
    vatNumber: values.vatNumber.trim()
  };

  if (dish.addDish && dish.name.trim()) {
    payload.dish = {
      name: dish.name.trim(),
      description: dish.description.trim(),
      price: parseFloat(dish.price),
      type: dish.type
    };
  }

  return payload;
}

export default CreateFirstRestaurantWizard;

/**
 * SetupWizard - guided first-run bootstrap in three steps
 * verifica accesso (PIN quando serve) -> configura admin -> riepilogo
 */

import { useState } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { TerminalButton } from '../../components/Auth/TerminalButton.jsx';

const STEPS = [
  { label: 'verifica accesso', eyebrow: 'bootstrap / access', title: 'VERIFICA ACCESSO', subtitle: 'Il backend controlla la richiesta prima di creare l\'account.' },
  { label: 'configura admin', eyebrow: 'bootstrap / identity', title: 'CONFIGURA ADMIN', subtitle: 'Email e contatti restano sull\'account amministratore.' },
  { label: 'riepilogo', eyebrow: 'bootstrap / review', title: 'CONTROLLA I DATI', subtitle: 'Un ultimo sguardo prima di generare le credenziali.' }
];

const INITIAL_VALUES = { email: '', name: '', surname: '', street: '', city: '', zip: '', pin: '' };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hasAddress(values) {
  return Boolean(values.street.trim() || values.city.trim() || values.zip.trim());
}

function validateStep(step, values, pinRequired) {
  const errors = {};

  if (step === 0 && pinRequired && !values.pin.trim()) {
    errors.pin = 'Inserisci il PIN stampato nella console del backend.';
  }

  if (step === 1) {
    if (!values.email.trim()) errors.email = 'Email richiesta';
    else if (!EMAIL_PATTERN.test(values.email)) errors.email = 'Email non valida';
    if (values.name.trim().length < 2) errors.name = 'Inserisci almeno 2 caratteri';
    if (values.surname.trim().length < 2) errors.surname = 'Inserisci almeno 2 caratteri';
    if (hasAddress(values)) {
      if (!values.street.trim()) errors.street = 'Completa la via';
      if (!values.city.trim()) errors.city = 'Completa la città';
      if (!values.zip.trim()) errors.zip = 'Completa il CAP';
    }
  }

  return errors;
}

function buildPayload(values, pinRequired) {
  const payload = {
    email: values.email.trim(),
    name: values.name.trim(),
    surname: values.surname.trim()
  };

  if (hasAddress(values)) {
    payload.address = {
      street: values.street.trim(),
      city: values.city.trim(),
      zip: values.zip.trim()
    };
  }

  if (pinRequired) payload.pin = values.pin.trim();

  return payload;
}

function Field({ label, name, value, onInput, error, type = 'text', autocomplete, placeholder, wide = false }) {
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

export function SetupWizard({
  pinRequired = false,
  onSubmit = () => {},
  loading = false,
  error = ''
}) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});

  const update = (field, value) => {
    setValues(previous => ({ ...previous, [field]: value }));
    if (errors[field]) setErrors(previous => ({ ...previous, [field]: '' }));
  };

  const back = () => {
    setErrors({});
    setStep(previous => Math.max(previous - 1, 0));
  };

  const advance = (event) => {
    event.preventDefault();
    const nextErrors = validateStep(step, values, pinRequired);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (step === STEPS.length - 1) {
      onSubmit(buildPayload(values, pinRequired));
      return;
    }

    setStep(previous => Math.min(previous + 1, STEPS.length - 1));
  };

  const current = STEPS[step];

  return html`
    <form class="auth-form setup-wizard" onSubmit=${advance} novalidate>
      <header class="setup-head">
        <p class="eyebrow">${current.eyebrow}</p>
        <h2 id="setup-step-title">${current.title}</h2>
        <p class="setup-sub">${current.subtitle}</p>
      </header>

      <div class="wizard-progress" aria-label="Avanzamento setup">
        ${STEPS.map((item, index) => html`
          <span class=${`wizard-progress-step ${index === step ? 'active' : ''} ${index < step ? 'complete' : ''}`}>
            <b>${String(index + 1).padStart(2, '0')}</b> ${item.label}
          </span>
        `)}
      </div>

      <div class="wizard-viewport setup-viewport">
        <section class="wizard-step" key=${step} aria-labelledby="setup-step-title">
          ${step === 0 && html`
            <div class="wizard-fields">
              ${pinRequired
                ? html`<${Field} label="pin dalla console backend" name="pin" value=${values.pin} error=${errors.pin} placeholder="000000" onInput=${event => update('pin', event.currentTarget.value)} wide />`
                : html`<p class="setup-note"><b>accesso locale rilevato.</b> Non serve un PIN per questa installazione.</p>`}
            </div>
          `}

          ${step === 1 && html`
            <div class="wizard-fields two-up">
              <${Field} label="email" name="email" type="email" autocomplete="email" placeholder="capo@burger.sh" value=${values.email} error=${errors.email} onInput=${event => update('email', event.currentTarget.value)} wide />
              <${Field} label="nome" name="name" autocomplete="given-name" placeholder="come ti chiami?" value=${values.name} error=${errors.name} onInput=${event => update('name', event.currentTarget.value)} />
              <${Field} label="cognome" name="surname" autocomplete="family-name" placeholder="il tuo cognome" value=${values.surname} error=${errors.surname} onInput=${event => update('surname', event.currentTarget.value)} />
              <${Field} label="via (opzionale)" name="street" autocomplete="street-address" placeholder="Via Roma 1" value=${values.street} error=${errors.street} onInput=${event => update('street', event.currentTarget.value)} wide />
              <${Field} label="città (opzionale)" name="city" autocomplete="address-level2" placeholder="Milano" value=${values.city} error=${errors.city} onInput=${event => update('city', event.currentTarget.value)} />
              <${Field} label="CAP (opzionale)" name="zip" autocomplete="postal-code" placeholder="20100" value=${values.zip} error=${errors.zip} onInput=${event => update('zip', event.currentTarget.value)} />
            </div>
            <p class="wizard-hint">L'indirizzo è facoltativo e lo trovi poi nel profilo.</p>
          `}

          ${step === 2 && html`
            <div class="setup-review">
              <p class="eyebrow">riepilogo richiesta</p>
              <p><span>email</span><b>${values.email}</b></p>
              <p><span>nome</span><b>${values.name} ${values.surname}</b></p>
              ${hasAddress(values) && html`<p><span>indirizzo</span><b>${values.street}, ${values.city} ${values.zip}</b></p>`}
              <p class="setup-note">Il backend genera una password provvisoria e semina il menu iniziale.</p>
            </div>
          `}
        </section>
      </div>

      ${error && html`<p class="form-message" aria-live="polite">${error}</p>`}

      <div class="wizard-actions">
        ${step > 0
          ? html`<${TerminalButton} type="button" onClick=${back}>[ ← ] indietro<//>`
          : html`<span></span>`}
        <${TerminalButton} primary type="submit" disabled=${loading}>
          [ ${step === STEPS.length - 1 ? 'enter' : '→'} ] ${step === STEPS.length - 1 ? 'crea amministratore' : 'continua'}
        <//>
      </div>
    </form>
  `;
}

export default SetupWizard;

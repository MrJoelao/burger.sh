/**
 * RegisterWizard - guided registration flow for new accounts
 */

import { useEffect, useState } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { TerminalButton } from '../../components/Auth/TerminalButton.jsx';

const PREFERENCES = [
  ['vegetariano', 'Vegetariano'],
  ['vegano', 'Vegano'],
  ['senza_glutine', 'Senza glutine'],
  ['piccante', 'Piccante'],
  ['offerte_speciali', 'Offerte speciali'],
  ['consegna_rapida', 'Consegna rapida'],
  ['ritiro_in_sede', 'Ritiro in sede']
];

const STEPS = [
  { eyebrow: 'identity gate / account type', title: 'SCEGLI IL TUO RUOLO.', subtitle: 'Partiamo da come userai burger.sh.' },
  { eyebrow: 'identity gate / profile', title: 'PRESENTATI.', subtitle: 'Un nome rende ogni ordine riconoscibile.' },
  { eyebrow: 'identity gate / credentials', title: 'METTI AL SICURO.', subtitle: 'Crea le credenziali per ritrovare il tuo profilo.' },
  { eyebrow: 'identity gate / delivery', title: 'DOVE TI TROVI?', subtitle: 'Così prepariamo consegne e ritiri senza errori.' },
  { eyebrow: 'identity gate / preferences', title: 'COSA TI VA?', subtitle: 'Scegli i segnali che vuoi vedere nel menu.' }
];

const INITIAL_ANSWERS = {
  name: '',
  surname: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: '',
  street: '',
  city: '',
  zip: '',
  preferences: []
};

function validateStep(step, answers) {
  const errors = {};

  if (step === 0 && !answers.role) errors.role = 'Scegli un tipo di account';
  if (step === 1) {
    if (answers.name.trim().length < 2) errors.name = 'Inserisci almeno 2 caratteri';
    if (answers.surname.trim().length < 2) errors.surname = 'Inserisci almeno 2 caratteri';
  }
  if (step === 2) {
    if (!answers.email.trim()) errors.email = 'Email richiesta';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers.email)) errors.email = 'Email non valida';
    if (!answers.password) errors.password = 'Password richiesta';
    else if (answers.password.length < 6) errors.password = 'Almeno 6 caratteri';
    if (answers.password !== answers.confirmPassword) errors.confirmPassword = 'Le password non coincidono';
  }
  if (step === 3) {
    const hasAddress = answers.street.trim() || answers.city.trim() || answers.zip.trim();
    if (hasAddress) {
      if (!answers.street.trim()) errors.street = 'Completa la via';
      if (!answers.city.trim()) errors.city = 'Completa la città';
      if (!answers.zip.trim()) errors.zip = 'Completa il CAP';
    }
  }

  return errors;
}

function Field({ label, name, value, onInput, error, type = 'text', autocomplete, placeholder, wide = false }) {
  return html`
    <label class=${wide ? 'wizard-field wide' : 'wizard-field'}>
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
      ${error && html`<span class="form-message" id=${`${name}-error`}>${error}</span>`}
    </label>
  `;
}

export function RegisterWizard({
  onSubmit = () => {},
  onSwitchMode = () => {},
  error = '',
  loading = false,
  onStepChange = () => {}
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(INITIAL_ANSWERS);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    onStepChange(step);
  }, [step, onStepChange]);

  const update = (field, value) => {
    setAnswers(previous => ({ ...previous, [field]: value }));
    if (errors[field]) setErrors(previous => ({ ...previous, [field]: '' }));
  };

  const next = (event) => {
    event.preventDefault();
    const nextErrors = validateStep(step, answers);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setStep(previous => Math.min(previous + 1, STEPS.length - 1));
  };

  const back = () => {
    setErrors({});
    setStep(previous => Math.max(previous - 1, 0));
  };

  const submit = (event) => {
    event.preventDefault();
    const nextErrors = validateStep(step, answers);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = {
      name: answers.name.trim(),
      surname: answers.surname.trim(),
      email: answers.email.trim(),
      password: answers.password,
      role: answers.role,
      preferences: answers.preferences
    };
    if (answers.street.trim() || answers.city.trim() || answers.zip.trim()) {
      payload.address = {
        street: answers.street.trim(),
        city: answers.city.trim(),
        zip: answers.zip.trim()
      };
    }
    onSubmit(payload);
  };

  const current = STEPS[step];
  const isManager = answers.role === 'manager';

  return html`
    <form class="auth-form register-wizard" onSubmit=${step === STEPS.length - 1 ? submit : next} novalidate>
      <div class="wizard-progress" aria-label="Avanzamento registrazione">
        ${STEPS.map((item, index) => html`
          <span class=${`wizard-progress-step ${index === step ? 'active' : ''} ${index < step ? 'complete' : ''}`}>
            <b>${String(index + 1).padStart(2, '0')}</b> ${item.title.replace('.', '').toLowerCase()}
          </span>
        `)}
      </div>

      <div class="wizard-viewport">
        <section class="wizard-step" key=${step} aria-labelledby="wizard-step-title">
          <p class="wizard-explainer">${step === 0 ? 'Il ruolo determina gli strumenti e il percorso che vedrai.' : current.subtitle}</p>

          ${step === 0 && html`
            <div class="role-cards" role="radiogroup" aria-label="Tipo di account">
              <button type="button" class=${`role-card ${answers.role === 'customer' ? 'selected' : ''}`} onClick=${() => update('role', 'customer')} aria-pressed=${answers.role === 'customer'}>
                <span class="role-card-kicker">01 / customer</span>
                <strong>CLIENTE</strong>
                <span>Ordina, salva i preferiti e segui la tua coda.</span>
              </button>
              <button type="button" class=${`role-card ${answers.role === 'manager' ? 'selected' : ''}`} onClick=${() => update('role', 'manager')} aria-pressed=${answers.role === 'manager'}>
                <span class="role-card-kicker">02 / manager</span>
                <strong>MANAGER</strong>
                <span>Gestisci una sede e le operazioni del ristorante.</span>
              </button>
            </div>
            ${errors.role && html`<p class="form-message">${errors.role}</p>`}
          `}

          ${step === 1 && html`
            <div class="wizard-fields two-up">
              <${Field} label="nome" name="name" autocomplete="given-name" placeholder="come ti chiami?" value=${answers.name} error=${errors.name} onInput=${event => update('name', event.target.value)} />
              <${Field} label="cognome" name="surname" autocomplete="family-name" placeholder="il tuo cognome" value=${answers.surname} error=${errors.surname} onInput=${event => update('surname', event.target.value)} />
            </div>
          `}

          ${step === 2 && html`
            <div class="wizard-fields two-up">
              <${Field} label="email" name="email" type="email" autocomplete="email" placeholder="you@example.com" value=${answers.email} error=${errors.email} onInput=${event => update('email', event.target.value)} wide />
              <${Field} label="password" name="password" type="password" autocomplete="new-password" placeholder="••••••••" value=${answers.password} error=${errors.password} onInput=${event => update('password', event.target.value)} />
              <${Field} label="conferma password" name="confirmPassword" type="password" autocomplete="new-password" placeholder="••••••••" value=${answers.confirmPassword} error=${errors.confirmPassword} onInput=${event => update('confirmPassword', event.target.value)} />
            </div>
          `}

          ${step === 3 && html`
            <div class="wizard-fields two-up">
              <${Field} label="via (opzionale)" name="street" autocomplete="street-address" placeholder="Via Roma 1" value=${answers.street} error=${errors.street} onInput=${event => update('street', event.target.value)} wide />
              <${Field} label="città (opzionale)" name="city" autocomplete="address-level2" placeholder="Milano" value=${answers.city} error=${errors.city} onInput=${event => update('city', event.target.value)} />
              <${Field} label="CAP (opzionale)" name="zip" autocomplete="postal-code" placeholder="20100" value=${answers.zip} error=${errors.zip} onInput=${event => update('zip', event.target.value)} />
            </div>
            ${isManager && html`<p class="manager-pending"><b>manager / pending</b> Il tuo account verrà attivato dopo l'approvazione di un admin.</p>`}
            ${!isManager && html`<p class="wizard-hint">Puoi saltare questo passo e aggiungere l'indirizzo più avanti dal profilo.</p>`}
          `}

          ${step === 4 && html`
            <div class="preference-grid">
              ${PREFERENCES.map(([value, label]) => html`
                <label class=${`preference-option ${answers.preferences.includes(value) ? 'selected' : ''}`}>
                  <input type="checkbox" value=${value} checked=${answers.preferences.includes(value)} onChange=${event => {
                    const preferences = event.target.checked
                      ? [...answers.preferences, value]
                      : answers.preferences.filter(item => item !== value);
                    update('preferences', preferences);
                  }} />
                  <span>${label}</span>
                </label>
              `)}
            </div>
            <p class="wizard-hint">Sono facoltative: servono solo a rendere il menu più utile per te.</p>
          `}
        </section>
      </div>

      ${error && html`<p class="form-message" id="register-message" aria-live="polite">${error}</p>`}
      <div class="wizard-actions">
        ${step > 0
          ? html`<${TerminalButton} type="button" onClick=${back}>[ ← ] indietro<//>`
          : html`<span></span>`}
        <${TerminalButton} primary type="submit" disabled=${loading}>
          [ ${step === STEPS.length - 1 ? 'enter' : '→'} ] ${step === STEPS.length - 1 ? 'crea account' : 'continua'}
        <//>
      </div>
      <footer class="auth-switch">
        <span>Hai già un account?</span>
        <button type="button" id="auth-switch" onClick=${onSwitchMode}>accedi</button>
      </footer>
      <p class="prototype-note">I dati vengono inviati in modo sicuro al backend.</p>
    </form>
  `;
}

export default RegisterWizard;

import { html } from '../../utils/htm.js';
import { useEffect, useState } from 'preact/hooks';
import { TerminalWindow } from '../../components/Layout/TerminalWindow.jsx';
import { SectionHeading } from '../../components/UI/SectionHeading.jsx';
import { TerminalButton } from '../../components/Auth/TerminalButton.jsx';
import { setupService } from '../../services/setupService.js';
import { navigate } from '../../router/navigate.js';

const STEPS = [
  { eyebrow: 'bootstrap / access', title: 'VERIFICA_<span>ACCESSO</span>' },
  { eyebrow: 'bootstrap / identity', title: 'CONFIGURA_<span>ADMIN</span>' },
  { eyebrow: 'bootstrap / review', title: 'CONTROLLA_<span>DATI</span>' }
];

const initialForm = {
  email: '',
  name: '',
  surname: '',
  address: { street: '', city: '', zip: '' }
};

export function SetupPage({ changePassword = false }) {
  const [step, setStep] = useState(0);
  const [pinRequired, setPinRequired] = useState(false);
  const [pin, setPin] = useState('');
  const [form, setForm] = useState(initialForm);
  const [credentials, setCredentials] = useState(null);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (changePassword) return undefined;
    let cancelled = false;
    setupService.requestPin()
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          setPinRequired(result.data?.pinRequired === true);
          return;
        }
        setError(result.message || 'Impossibile preparare il setup.');
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message);
      });
    return () => { cancelled = true; };
  }, [changePassword]);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validateStep = () => {
    if (step === 0 && pinRequired && !pin.trim()) {
      setError('Inserisci il PIN stampato nella console del backend.');
      return false;
    }
    if (step === 1 && (!form.email.trim() || !form.name.trim() || !form.surname.trim())) {
      setError('Completa email, nome e cognome per continuare.');
      return false;
    }
    setError('');
    return true;
  };

  const next = (event) => {
    event.preventDefault();
    if (!validateStep()) return;
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const execute = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = { ...form, ...(pinRequired ? { pin } : {}) };
      const result = await setupService.executeSetup(payload);
      if (!result.success) {
        setError(result.message || 'Setup non riuscito.');
        return;
      }
      setCredentials(result.data);
    } catch (requestError) {
      setError(requestError.status === 403
        ? 'Setup disabilitato in produzione. Abilita ALLOW_FIRST_RUN_SETUP=true.'
        : requestError.message || 'Setup non riuscito.');
    } finally {
      setBusy(false);
    }
  };

  const submitPasswordChange = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await setupService.changePassword(
        passwords.currentPassword,
        passwords.newPassword
      );
      if (result.success) {
        navigate('/');
        return;
      }
      setError(result.message || 'Cambio password non riuscito.');
    } catch (requestError) {
      setError(requestError.message || 'Cambio password non riuscito.');
    } finally {
      setBusy(false);
    }
  };

  const input = (key, label, type = 'text') => html`
    <label class="setup-field">
      <span>${label}</span>
      <input
        required
        type=${type}
        value=${form[key]}
        onInput=${(event) => updateForm(key, event.currentTarget.value)}
      />
    </label>
  `;

  if (changePassword) {
    return html`
      <${TerminalWindow} title="change-password" subtitle="system bootstrap">
        <section class="terminal-screen setup-page">
          <${SectionHeading} eyebrow="bootstrap / security" title="CAMBIO_<span>PASSWORD</span>" />
          <p class="setup-lead">Il primo accesso richiede una nuova password prima di aprire la console.</p>
          ${error && html`<p class="form-message">${error}</p>`}
          <form class="setup-form" onSubmit=${submitPasswordChange}>
            <label class="setup-field"><span>password provvisoria</span><input required type="password" value=${passwords.currentPassword} onInput=${(event) => setPasswords({ ...passwords, currentPassword: event.currentTarget.value })} /></label>
            <label class="setup-field"><span>nuova password</span><input required minLength="8" type="password" value=${passwords.newPassword} onInput=${(event) => setPasswords({ ...passwords, newPassword: event.currentTarget.value })} /></label>
            <${TerminalButton} primary type="submit" disabled=${busy}>[ enter ] aggiorna password<//>
          </form>
        </section>
      <//>
    `;
  }

  return html`
    <${TerminalWindow} title="first-run-setup" subtitle="system bootstrap">
      <section class="terminal-screen setup-page">
        ${credentials ? html`
          <${SectionHeading} eyebrow="bootstrap / complete" title="ACCESSO_<span>CREATO</span>" />
          <div class="setup-credentials">
            <p class="eyebrow">credenziali provvisorie — salvale ora</p>
            <p>email: <b>${credentials.adminEmail}</b></p>
            <p>password: <b>${credentials.adminPassword}</b></p>
            <p>Accedi con queste credenziali e completa il cambio password obbligatorio.</p>
            <${TerminalButton} primary onClick=${() => navigate('/auth')}>[ enter ] vai al login<//>
          </div>
        ` : html`
          <header class="setup-header">
            <${SectionHeading} eyebrow=${STEPS[step].eyebrow} title=${STEPS[step].title} />
            <p class="setup-lead">Nessun amministratore è configurato. Segui i passaggi nell'ordine per avviare burger.sh.</p>
          </header>
          <div class="setup-progress" aria-label="Avanzamento setup">
            ${STEPS.map((item, index) => html`<span class=${`${index === step ? 'active' : ''} ${index < step ? 'complete' : ''}`}><b>0${index + 1}</b> ${item.eyebrow.split(' / ')[1]}</span>`)}
          </div>
          ${error && html`<p class="form-message" aria-live="polite">${error}</p>`}

          ${step === 0 && html`
            <div class="setup-step">
              <p>Il backend verifica la richiesta prima di creare l'account.</p>
              ${pinRequired
                ? html`<label class="setup-field"><span>pin dalla console backend</span><input required inputmode="numeric" value=${pin} onInput=${(event) => setPin(event.currentTarget.value)} /></label>`
                : html`<p class="setup-note"><b>accesso locale rilevato.</b> Non serve un PIN per questa installazione.</p>`}
            </div>
          `}
          ${step === 1 && html`
            <div class="setup-step setup-fields">
              ${input('email', 'email contatto', 'email')}
              ${input('name', 'nome')}
              ${input('surname', 'cognome')}
            </div>
          `}
          ${step === 2 && html`
            <div class="setup-step setup-review">
              <p class="eyebrow">riepilogo richiesta</p>
              <p><span>email</span><b>${form.email}</b></p>
              <p><span>nome</span><b>${form.name} ${form.surname}</b></p>
              <p class="setup-note">Il backend genererà le credenziali provvisorie e seminerà il menu iniziale.</p>
            </div>
          `}

          <form onSubmit=${step === STEPS.length - 1 ? execute : next}>
            <div class="setup-actions">
              ${step > 0 && html`<${TerminalButton} type="button" onClick=${() => { setError(''); setStep((current) => current - 1); }}>[ ← ] indietro<//>`}
              <${TerminalButton} primary type="submit" disabled=${busy}>[ ${step === STEPS.length - 1 ? 'enter' : '→'} ] ${step === STEPS.length - 1 ? 'crea amministratore' : 'continua'}<//>
            </div>
          </form>
        `}
      </section>
    <//>
  `;
}

export default SetupPage;

/**
 * SetupPage - first-run bootstrap page
 * container: recupera lo stato di accesso, esegue il setup e mostra le
 * credenziali provvisorie una sola volta, dentro il guscio a tutto schermo
 */

import { useEffect, useState } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { SetupLayout } from './SetupLayout.jsx';
import { SetupWizard } from './SetupWizard.jsx';
import { TerminalButton } from '../../components/Auth/TerminalButton.jsx';
import { setupService } from '../../services/setupService.js';
import { navigate } from '../../router/navigate.js';

export function SetupPage() {
  const [pinRequired, setPinRequired] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
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
  }, []);

  const execute = async (payload) => {
    setBusy(true);
    setError('');
    try {
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

  return html`
    <${SetupLayout}
      section="first-run-setup"
      context="system bootstrap"
      status=${credentials ? 'setup complete' : 'awaiting bootstrap'}
      boot
    >
      ${credentials
        ? html`<${CredentialsPanel} credentials=${credentials} />`
        : html`<section class="setup-panel">
            <${SetupWizard} pinRequired=${pinRequired} onSubmit=${execute} loading=${busy} error=${error} />
          </section>`}
    <//>
  `;
}

function CredentialsPanel({ credentials }) {
  return html`
    <section class="setup-panel">
      <header class="setup-head">
        <p class="eyebrow">bootstrap / complete</p>
        <h2>ACCESSO CREATO</h2>
        <p class="setup-sub">Salva queste credenziali ora: la password provvisoria non verrà mostrata di nuovo.</p>
      </header>
      <div class="setup-credentials">
        <p><span>email</span><b>${credentials.adminEmail}</b></p>
        <p><span>password</span><b>${credentials.adminPassword}</b></p>
        <p class="setup-note">Accedi con queste credenziali e cambia subito la password.</p>
        <${TerminalButton} primary onClick=${() => navigate('/auth')}>[ enter ] vai al login<//>
      </div>
    </section>
  `;
}

export default SetupPage;

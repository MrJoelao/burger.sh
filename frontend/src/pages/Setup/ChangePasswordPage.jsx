/**
 * ChangePasswordPage - dedicated page for the forced first-login change
 * it belongs to the setup flow, so it reuses the full screen setup shell
 */

import { useState } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { SetupLayout } from './SetupLayout.jsx';
import { ChangePasswordForm } from './ChangePasswordForm.jsx';
import { setupService } from '../../services/setupService.js';
import { useAuthStore } from '../../state/authStore.js';
import { dashboardPathFor } from '../../domain/roles.js';
import { navigate } from '../../router/navigate.js';

export function ChangePasswordPage() {
  const { user, completePasswordChange } = useAuthStore();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async ({ currentPassword, newPassword }) => {
    setBusy(true);
    setError('');
    try {
      const result = await setupService.changePassword(currentPassword, newPassword);
      if (result.success) {
        /* aggiorno la sessione prima di uscire, altrimenti mustChangePassword
           resta true in memoria e il router riporta qui all'infinito */
        await completePasswordChange();
        navigate(dashboardPathFor(user?.role));
        return;
      }
      setError(result.message || 'Cambio password non riuscito.');
    } catch (requestError) {
      setError(requestError.message || 'Cambio password non riuscito.');
    } finally {
      setBusy(false);
    }
  };

  return html`
    <${SetupLayout}
      section="change-password"
      context="system bootstrap"
      status="password change required"
    >
      <section class="setup-panel">
        <header class="setup-head">
          <p class="eyebrow">bootstrap / security</p>
          <h2 id="setup-step-title">CAMBIO PASSWORD</h2>
          <p class="setup-sub">Il primo accesso richiede una nuova password prima di aprire la console.</p>
        </header>
        <${ChangePasswordForm} onSubmit=${submit} loading=${busy} error=${error} />
      </section>
    <//>
  `;
}

export default ChangePasswordPage;

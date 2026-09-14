/**
 * DebugConsole - strumenti di diagnosi per l'admin.
 * Mostra salute del backend, stato del setup e sessione corrente (token
 * mascherato con la sua scadenza), e offre azioni di ripristino. È un pannello
 * collassabile, così resta fuori dai piedi finché non serve.
 */

import { useState, useEffect, useCallback } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { useAuthStore } from '../../state/authStore.js';
import { getAuthToken, clearAuthToken } from '../../services/api.js';
import { systemService } from '../../services/systemService.js';
import { setupService } from '../../services/setupService.js';
import { navigate } from '../../router/navigate.js';
import { TerminalButton } from '../../components/Auth/TerminalButton.jsx';
import { ConfirmAction } from './components/ConfirmAction.jsx';
import { decodeJwtPayload, maskToken, tokenTiming } from '../../domain/debug.js';

export function DebugConsole() {
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [health, setHealth] = useState(null);
  const [setup, setSetup] = useState(null);
  const [notice, setNotice] = useState('');

  const token = getAuthToken();
  const payload = decodeJwtPayload(token);
  const timing = tokenTiming(payload);

  const probe = useCallback(async () => {
    setNotice('');
    setHealth(await probeSafely(systemService.health));
    setSetup(await probeSafely(setupService.getStatus));
  }, []);

  useEffect(() => {
    if (open) probe();
  }, [open, probe]);

  const copySession = async () => {
    if (!navigator.clipboard) {
      setNotice('clipboard non disponibile: usa il pannello json qui sotto');
      return;
    }

    try {
      await navigator.clipboard.writeText(sessionSnapshot(user, token, payload, timing));
      setNotice('sessione copiata negli appunti');
    } catch (_error) {
      setNotice('copia non riuscita: usa il pannello json qui sotto');
    }
  };

  const clearStorage = () => {
    localStorage.clear();
    clearAuthToken();
    setNotice('storage locale svuotato, esegui di nuovo il login');
  };

  const signOut = () => {
    logout();
    navigate('/auth');
  };

  return html`
    <div class="panel-block debug-console">
      <button class="debug-toggle" type="button" aria-expanded=${open} onClick=${() => setOpen(!open)}>
        <span class="eyebrow">diagnostica</span>
        <b>${open ? '[-] chiudi console' : '[+] apri console'}</b>
      </button>

      ${open && html`
        <div class="debug-body">
          ${notice && html`<p class="debug-notice" role="status">${notice}</p>`}

          <div class="debug-grid">
            <section class="debug-card">
              <p class="eyebrow">backend</p>
              ${renderHealth(health)}
            </section>
            <section class="debug-card">
              <p class="eyebrow">setup</p>
              ${renderSetup(setup)}
            </section>
            <section class="debug-card">
              <p class="eyebrow">sessione</p>
              ${renderSession(user, token, timing)}
            </section>
          </div>

          <div class="debug-actions">
            <${TerminalButton} onClick=${probe}>[ r ] rifai controlli<//>
            <${TerminalButton} onClick=${copySession}>[ c ] copia sessione<//>
            <${TerminalButton} onClick=${signOut}>[ q ] logout<//>
            <${ConfirmAction} label="[ x ] svuota storage" confirmLabel="svuotare i dati locali?" onConfirm=${clearStorage} />
          </div>

          <details class="debug-raw">
            <summary class="eyebrow">json sessione</summary>
            <pre>${sessionSnapshot(user, token, payload, timing)}</pre>
          </details>
        </div>
      `}
    </div>
  `;
}

async function probeSafely(probe) {
  try {
    return await probe();
  } catch (error) {
    return { error: error.message || 'richiesta non riuscita' };
  }
}

function renderHealth(health) {
  if (!health) return html`<p class="debug-value">∅</p>`;
  if (health.error) return html`<p class="debug-value tone-alert">non raggiungibile: ${health.error}</p>`;

  return html`<p class="debug-value tone-acid">ok · ${health.message || 'backend attivo'}</p>`;
}

function renderSetup(setup) {
  if (!setup) return html`<p class="debug-value">∅</p>`;
  if (setup.error) return html`<p class="debug-value tone-alert">non disponibile: ${setup.error}</p>`;

  const status = setup.data || {};
  return html`
    <dl class="debug-list">
      <div><dt>admin creato</dt><dd>${status.adminExists ? 'sì' : 'no'}</dd></div>
      <div><dt>setup completato</dt><dd>${status.setupCompleted ? 'sì' : 'no'}</dd></div>
    </dl>
  `;
}

function renderSession(user, token, timing) {
  return html`
    <dl class="debug-list">
      <div><dt>ruolo</dt><dd>${user?.role || '∅'}</dd></div>
      <div><dt>stato manager</dt><dd>${user?.managerStatus || 'n/d'}</dd></div>
      <div><dt>id</dt><dd>${user?.id || '∅'}</dd></div>
      <div><dt>email</dt><dd>${user?.email || '∅'}</dd></div>
      <div><dt>cambio password</dt><dd>${user?.mustChangePassword ? 'richiesto' : 'no'}</dd></div>
      <div><dt>token</dt><dd>${maskToken(token)}</dd></div>
      <div><dt>scadenza</dt><dd>${describeTiming(timing)}</dd></div>
    </dl>
  `;
}

function describeTiming(timing) {
  if (!timing) return 'sconosciuta';
  if (timing.expired) return 'scaduto';

  const minutes = Math.floor(timing.remainingSeconds / 60);
  const seconds = String(timing.remainingSeconds % 60).padStart(2, '0');
  return `${minutes}m ${seconds}s`;
}

function sessionSnapshot(user, token, payload, timing) {
  return JSON.stringify({ user, token: maskToken(token), payload, timing }, null, 2);
}

export default DebugConsole;

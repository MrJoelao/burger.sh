/**
 * AuthRequiredModal - Modal che appare quando un utente non autenticato tenta
 * di eseguire un'azione protetta (aggiungere al carrello, procedere al pagamento).
 * Offra la possibilità di accedere o registrarsi, oppure tornare indietro.
 */

import { html } from '../../utils/htm.js';
import { navigate } from '../../router/navigate.js';

export function AuthRequiredModal({ onDismiss }) {
  return html`
    <div class="auth-required-overlay" role="dialog" aria-modal="true" aria-labelledby="auth-required-title">
      <div class="auth-required-backdrop" onClick=${onDismiss}></div>
      <div class="auth-required-content">
        <header class="auth-required-header">
          <h2 id="auth-required-title">SESSIONE_<span style=${{ color: 'var(--alert)' }}>NECESSARIA</span></h2>
          <button
            class="auth-required-close"
            type="button"
            aria-label="Chiudi"
            onClick=${onDismiss}
          >[ x ]</button>
        </header>

        <section class="auth-required-body">
          <p><b>_</b> per ordinare devi avere un account attivo.</p>
          <p class="muted">Puoi comunque sfogliare il menu delle filiali. Quando sei pronto a confermare l'ordine, accedi o registrati.</p>
        </section>

        <footer class="auth-required-footer">
          <button class="terminal-button primary" type="button" onClick=${() => navigate('/auth')}>
            [ enter ] accedi <b>→</b>
          </button>
          <button class="terminal-button" type="button" onClick=${() => navigate('/auth')}>
            [ shift+enter ] registrati
          </button>
          <button class="terminal-button" type="button" onClick=${onDismiss}>
            [ esc ] continua a sfogliare
          </button>
        </footer>
      </div>
    </div>
  `;
}

export default AuthRequiredModal;

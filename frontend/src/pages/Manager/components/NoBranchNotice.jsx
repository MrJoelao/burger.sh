/**
 * NoBranchNotice - cosa vede un manager senza filiale.
 * Due casi distinti: un account ancora in attesa di approvazione, che non può
 * fare nulla finché un admin non lo abilita, e un account approvato che non ha
 * ancora una sede e deve aprirla.
 */

import { html } from '../../../utils/htm.js';
import { TerminalButton } from '../../../components/Auth/TerminalButton.jsx';
import { navigate } from '../../../router/navigate.js';

export function NoBranchNotice({ area = 'questa sezione', pending = false }) {
  if (pending) {
    return html`
      <div class="queue-empty">
        <p><b>_</b> account in attesa di approvazione.</p>
        <p class="muted">
          Un admin deve approvarti prima che tu possa gestire una filiale, quindi ${area} resta bloccata.
        </p>
      </div>
    `;
  }

  return html`
    <div class="queue-empty">
      <p><b>_</b> nessuna filiale associata al tuo account.</p>
      <p class="muted">${area} richiede una sede attiva.</p>
      <${TerminalButton} primary onClick=${() => navigate('/manager/first-restaurant')}>
        [ enter ] apri la tua filiale
      <//>
    </div>
  `;
}

export default NoBranchNotice;

/**
 * ManagerQueue - coda dei manager in attesa di approvazione. È il compito
 * principale dell'admin secondo i docs: approvare o rifiutare gli account
 * registrati prima che possano gestire una filiale.
 */

import { html } from '../../../utils/htm.js';
import { TerminalButton } from '../../../components/Auth/TerminalButton.jsx';

export function ManagerQueue({ managers = [], onApprove, onReject, busyId = null }) {
  if (managers.length === 0) {
    return html`<p class="queue-empty"><b>_</b> nessun manager in attesa. La coda è vuota.</p>`;
  }

  return html`
    <ul class="action-queue">
      ${managers.map(manager => html`
        <li class="queue-item" key=${manager._id || manager.id}>
          <div class="queue-identity">
            <b>${manager.name} ${manager.surname || ''}</b>
            <span>${manager.email}</span>
          </div>
          <div class="queue-actions">
            <${TerminalButton} className="compact" primary disabled=${busyId === (manager._id || manager.id)} onClick=${() => onApprove(manager._id || manager.id)}>
              [ y ] approva
            <//>
            <${TerminalButton} className="compact" disabled=${busyId === (manager._id || manager.id)} onClick=${() => onReject(manager._id || manager.id)}>
              [ n ] rifiuta
            <//>
          </div>
        </li>
      `)}
    </ul>
  `;
}

export default ManagerQueue;

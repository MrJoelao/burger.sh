/**
 * BranchIdentity - scheda della sede del manager: anagrafica della filiale e
 * stato dell'account. è il contesto che manca alle pagine operative, così il
 * manager sa sempre per quale sede sta lavorando.
 */

import { html } from '../../../utils/htm.js';
import { managerStatusLabels } from '../../../domain/roles.js';
import { managerStatusTones } from '../../../domain/tones.js';

export function BranchIdentity({ branch = {}, managerStatus = 'pending', managerName = '' }) {
  return html`
    <article class="branch-card">
      <header class="branch-head">
        <b>${branch.name || 'sede senza nome'}</b>
        <span class="eyebrow">${branch.city || 'città n/d'}</span>
      </header>

      <dl class="branch-meta">
        <div><dt>indirizzo</dt><dd>${branch.address || 'n/d'}</dd></div>
        <div><dt>telefono</dt><dd>${branch.phone || 'n/d'}</dd></div>
        <div><dt>partita iva</dt><dd>${branch.vatNumber || 'n/d'}</dd></div>
        <div><dt>gestore</dt><dd>${managerName || 'n/d'}</dd></div>
        <div>
          <dt>stato</dt>
          <dd>
            <span class=${`tag tone-${managerStatusTones[managerStatus] || 'dirty'}`}>
              ${managerStatusLabels[managerStatus] || managerStatus}
            </span>
          </dd>
        </div>
      </dl>
    </article>
  `;
}

export default BranchIdentity;

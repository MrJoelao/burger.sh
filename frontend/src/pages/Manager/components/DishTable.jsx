/**
 * DishTable - tabella del menu di filiale. I piatti del menu comune restano di
 * sola lettura, i piatti custom della sede si modificano ed eliminano da qui.
 */

import { html } from '../../../utils/htm.js';
import { TerminalButton } from '../../../components/Auth/TerminalButton.jsx';
import { ConfirmAction } from '../../../components/Console/ConfirmAction.jsx';
import { isCustomDish } from '../../../domain/menu.js';
import { entityId } from '../../../domain/entity.js';
import { euro } from '../../../domain/format.js';

export function DishTable({ dishes = [], busyId = null, canManage, onEdit, onDelete }) {
  if (dishes.length === 0) {
    return html`<p class="queue-empty"><b>_</b> nessun piatto in questa sezione.</p>`;
  }

  return html`
    <div class="table-scroll">
      <table class="directory-table">
        <thead>
          <tr>
            <th>piatto</th>
            <th>tipologia</th>
            <th class="num">prezzo</th>
            <th>origine</th>
            <th>azioni</th>
          </tr>
        </thead>
        <tbody>
          ${dishes.map(dish => renderRow(dish, busyId, canManage, onEdit, onDelete))}
        </tbody>
      </table>
    </div>
  `;
}

function renderRow(dish, busyId, canManage, onEdit, onDelete) {
  const id = entityId(dish);
  const manageable = canManage(dish);

  return html`
    <tr key=${id}>
      <td class="cell-identity"><b>${dish.name}</b></td>
      <td>${dish.type || 'n/d'}</td>
      <td class="num">${euro(dish.price)}</td>
      <td>
        ${isCustomDish(dish)
          ? html`<span class="tag tone-amber">custom</span>`
          : html`<span class="tag tone-dirty">comune</span>`}
      </td>
      <td class="cell-actions">
        ${manageable
          ? html`
            <${TerminalButton} className="compact" disabled=${busyId === id} onClick=${() => onEdit(dish)}>
              [ e ] modifica
            <//>
            <${ConfirmAction}
              disabled=${busyId === id}
              label="[ x ] elimina"
              confirmLabel="eliminare il piatto?"
              onConfirm=${() => onDelete(id)}
            />
          `
          : html`<span class="muted">sola lettura</span>`}
      </td>
    </tr>
  `;
}

export default DishTable;

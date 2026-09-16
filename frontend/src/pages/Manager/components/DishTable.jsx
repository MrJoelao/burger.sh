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
    <div class="dish-card-grid manager-dish-grid">
      ${dishes.map(dish => renderCard(dish, busyId, canManage, onEdit, onDelete))}
    </div>
  `;
}

function renderCard(dish, busyId, canManage, onEdit, onDelete) {
  const id = entityId(dish);
  const manageable = canManage(dish);

  return html`
    <article class="dish-card manager-dish-card" key=${id}>
      <div class="dish-card-media">
        ${dish.photoUrl
          ? html`<img src=${dish.photoUrl} alt=${dish.name} />`
          : html`<span aria-hidden="true">${dish.type || 'menu'}</span>`}
      </div>
      <div class="dish-card-body">
        <div>
          <p class="eyebrow">${dish.type || 'specialità'}</p>
          <h3>${dish.name}</h3>
        </div>
        <p class="dish-card-price">${euro(dish.price)}</p>
      </div>
      <footer class="dish-card-actions manager-dish-actions">
        <span>
        ${isCustomDish(dish)
          ? html`<span class="tag tone-amber">custom</span>`
          : html`<span class="tag tone-dirty">comune</span>`}
        </span>
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
      </footer>
    </article>
  `;
}

export default DishTable;

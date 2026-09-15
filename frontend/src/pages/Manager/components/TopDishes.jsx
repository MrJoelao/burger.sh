/**
 * TopDishes - classifica dei piatti più venduti della filiale. Il numero
 * ordinale è reale (l'ordine conta), quindi qui la numerazione ha senso.
 */

import { html } from '../../../utils/htm.js';

export function TopDishes({ dishes = [] }) {
  if (dishes.length === 0) {
    return html`<p class="queue-empty"><b>_</b> nessuna vendita registrata finora.</p>`;
  }

  return html`
    <ol class="top-dishes">
      ${dishes.map((dish, index) => html`
        <li key=${dish.dishId || dish.name || index}>
          <span class="rank">${String(index + 1).padStart(2, '0')}</span>
          <span class="name">${dish.name}</span>
          <b>${dish.quantitySold || 0}</b>
        </li>
      `)}
    </ol>
  `;
}

export default TopDishes;

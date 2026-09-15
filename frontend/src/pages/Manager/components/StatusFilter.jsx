/**
 * StatusFilter - selezione dello stato ordine. Gli stati proposti sono quelli
 * del flusso reale, non un elenco inventato.
 */

import { html } from '../../../utils/htm.js';
import { statusLabels, statusOrder } from '../../../domain/orderStatus.js';

export function StatusFilter({ value = '', onChange }) {
  return html`
    <label class="filter-field">stato
      <select value=${value} onChange=${(event) => onChange(event.currentTarget.value)}>
        <option value="">tutti</option>
        ${statusOrder.map(status => html`<option value=${status}>${statusLabels[status]}</option>`)}
      </select>
    </label>
  `;
}

export default StatusFilter;

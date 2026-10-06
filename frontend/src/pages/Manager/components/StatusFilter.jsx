/**
 * StatusFilter - selezione dello stato ordine. Gli stati proposti sono quelli
 * accettati dal filtro del backend, non un elenco inventato.
 */

import { html } from '../../../utils/htm.js';
import { statusLabels, filterableStatuses } from '../../../domain/orderStatus.js';

export function StatusFilter({ value = '', onChange }) {
  return html`
    <label class="filter-field">stato
      <select value=${value} onChange=${(event) => onChange(event.currentTarget.value)}>
        <option value="">tutti</option>
        ${filterableStatuses.map(status => html`<option value=${status}>${statusLabels[status]}</option>`)}
      </select>
    </label>
  `;
}

export default StatusFilter;

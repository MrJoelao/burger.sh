/**
 * BufferAction - Primary action button for adding to buffer
 */

import { html } from '../../utils/htm.js';

export function BufferAction({
  label = 'add to buffer',
  keyLabel = 'enter',
  total = 0,
  onClick = () => {},
  disabled = false
}) {
  const formatEuro = (amount) => `€ ${amount.toFixed(2)}`;

  return html`
    <button
      class="buffer-action"
      type="button"
      onClick=${onClick}
      disabled=${disabled}
    >
      <span>[ ${keyLabel} ]</span> ${label} <b>${formatEuro(total)}</b>
    </button>
  `;
}

export default BufferAction;
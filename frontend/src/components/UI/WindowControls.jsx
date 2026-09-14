/**
 * WindowControls - Window control dots (close, minimize, maximize)
 */

import { html } from '../../utils/htm.js';

export function WindowControls({ ariaLabel = 'Window controls' }) {
  return html`
    <div class="window-controls" aria-hidden="true" aria-label=${ariaLabel}>
      <i></i>
      <i></i>
      <i></i>
    </div>
  `;
}

export default WindowControls;
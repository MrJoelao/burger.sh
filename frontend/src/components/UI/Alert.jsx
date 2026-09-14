/**
 * Alert - User-facing messages with appropriate colors
 */

import { html } from '../../utils/htm.js';

const typeClasses = {
  error: 'bg-alert text-white',
  success: 'bg-acid text-ink',
  info: 'bg-amber text-ink',
};

export function Alert({ type = 'info', message, onClose, className = '' }) {
  const bgClass = typeClasses[type] || typeClasses.info;

  return html`
    <div class="flex items-center justify-between p-2 rounded ${bgClass} ${className}" role="alert">
      <span>${message}</span>
      ${onClose && html`
        <button
          onClick=${onClose}
          aria-label="Close"
          class="ml-4 text-sm font-bold hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
        >x</button>
      `}
    </div>
  `;
}

export default Alert;
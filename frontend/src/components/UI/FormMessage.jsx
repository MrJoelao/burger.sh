/**
 * FormMessage - Validation/error message display
 * Consistent styling for form feedback
 */

import { html } from '../../utils/htm.js';

export function FormMessage({
  message = '',
  type = 'error', // 'error' | 'success' | 'info'
  id = '',
  ariaLive = 'polite'
}) {
  if (!message) return null;

  const colors = {
    error: 'var(--acid)',
    success: 'var(--acid)',
    info: 'var(--amber)'
  };

  return html`
    <p
      class="form-message"
      id=${id}
      aria-live=${ariaLive}
      style=${{ color: colors[type] || colors.error, fontSize: '10px', minHeight: '18px', margin: 0 }}
    >
      ${message}
    </p>
  `;
}

export default FormMessage;
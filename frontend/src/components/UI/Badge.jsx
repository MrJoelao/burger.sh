/**
 * Badge - Status indicator with semantic colors
 */

import { html } from '../../utils/htm.js';

const variantClasses = {
  success: 'bg-acid text-ink',
  error: 'bg-alert text-white',
  info: 'bg-amber text-ink',
  warning: 'bg-paper text-ink',
};

export function Badge({ variant = 'info', children, className = '' }) {
  const classes = `inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${variantClasses[variant] || variantClasses.info} ${className}`;
  return html`
    <span class=${classes} role="status" aria-live="polite">
      ${children}
    </span>
  `;
}

export default Badge;
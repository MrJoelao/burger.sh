/**
 * TerminalButton - Terminal-style button with [ LABEL ] format
 * Hover inverts colors, focus ring is amber
 */

import { html } from '../../utils/htm.js';

export function TerminalButton({ label, shortcutKey, className = '', onClick, ...rest }) {
  return html`
    <button
      class="py-1 px-3 border border-line text-paper hover:bg-amber hover:text-ink focus:outline-none focus:ring-2 focus:ring-amber ${className}"
      aria-keyshortcuts=${shortcutKey}
      onClick=${onClick}
      ...${rest}
    >
      [ ${label} ]
    </button>
  `;
}

export default TerminalButton;
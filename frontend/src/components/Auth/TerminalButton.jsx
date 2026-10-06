/**
 * TerminalButton - Reusable terminal-style button component
 */

import { html } from '../../utils/htm.js';

export function TerminalButton({
  children,
  primary = false,
  onClick = () => {},
  type = 'button',
  disabled = false,
  className = '',
  ...props
}) {
  const classes = `terminal-button ${primary ? 'primary' : ''} ${className}`.trim();

  return html`
    <button
      class=${classes}
      type=${type}
      onClick=${onClick}
      disabled=${disabled}
      ...${props}
    >
      ${children}
    </button>
  `;
}

export default TerminalButton;
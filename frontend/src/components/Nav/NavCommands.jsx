/**
 * NavCommands - Terminal-style navigation buttons
 */

import { html } from '../../utils/htm.js';

export function NavCommands({
  commands = [
    { id: 'order', label: 'nuovo ordine', key: '01', active: true },
    { id: 'menu', label: 'menu completo', key: '02', active: false },
    { id: 'info', label: 'allergeni', key: '03', active: false },
    { id: 'about', label: 'manifesto', key: '04', active: false }
  ],
  onCommandClick = () => {}
}) {
  return html`
    <nav class="command-list" aria-label="Comandi">
      <p class="eyebrow">directory</p>
      ${commands.map(cmd => html`
        <button
          class="nav-command ${cmd.active ? 'active' : ''}"
          type="button"
          data-screen=${cmd.id}
          onClick=${() => onCommandClick(cmd.id)}
        >
          <kbd>${cmd.key}</kbd> ${cmd.label}
        </button>
      `)}
      <div class="nav-footer">
        <span>tty / bgr-02</span>
        <span>theme / amber</span>
        <span>user / guest</span>
      </div>
    </nav>
  `;
}

export default NavCommands;
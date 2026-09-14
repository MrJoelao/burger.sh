/**
 * Navbar - Responsive navigation bar
 * Mobile-first: collapses to vertical list on small screens
 */

import { html } from '../../utils/htm.js';

export function Navbar({ brand = 'burger.sh', links = [], className = '' }) {
  return html`
    <nav class="flex flex-col sm:flex-row items-center justify-between p-4 bg-ink border-b border-line ${className}" role="navigation">
      <h1 class="text-amber font-archivo text-xl mb-2 sm:mb-0">${brand}</h1>
      <ul class="flex flex-col sm:flex-row gap-2">
        ${links.map(link => html`
          <li key=${link.to}>
            <a
              href=${link.to}
              class="text-paper hover:bg-amber hover:text-ink py-1 px-2 rounded focus:outline-none focus:ring-2 focus:ring-amber"
            >
              ${link.label}
            </a>
          </li>
        `)}
      </ul>
    </nav>
  `;
}

export default Navbar;
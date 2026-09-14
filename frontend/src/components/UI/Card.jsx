/**
 * Card - Container component with header, body, footer
 * Cyberpunk terminal style with amber border and glow
 */

import { html } from '../../utils/htm.js';

export function Card({ header, footer, children, className = '' }) {
  return html`
    <section class="bg-ink border border-line p-4 mb-4 ${className}" role="region" aria-label=${header || 'Card'}>
      ${header && html`
        <header class="mb-2 text-amber font-archivo" role="heading">
          ${header}
        </header>
      `}
      <div class="prose prose-sm max-w-none" role="article">
        ${children}
      </div>
      ${footer && html`
        <footer class="mt-2 text-amber" role="contentinfo">
          ${footer}
        </footer>
      `}
    </section>
  `;
}

export default Card;
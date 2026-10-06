/**
 * SectionHeading - Consistent section header component
 */

import { html } from '../../utils/htm.js';

export function SectionHeading({
  eyebrow = '',
  title = '',
  subtitle = '',
  titleSpan = ''
}) {
  return html`
    <header class="section-heading">
      ${eyebrow && html`<p class="eyebrow">${eyebrow}</p>`}
      <h2>${title}${titleSpan && html`<span>${titleSpan}</span>`}</h2>
      ${subtitle && html`<p class="subline">${subtitle}</p>`}
    </header>
  `;
}

export default SectionHeading;
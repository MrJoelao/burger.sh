/**
 * ProfileIndex - indice laterale delle sezioni del profilo. I collegamenti
 * puntano agli id dei pannelli, così la pagina resta navigabile da tastiera.
 */

import { html } from '../../../utils/htm.js';

export function ProfileIndex({ sections, activeId = '', onSelect = () => {} }) {
  return html`
    <nav class="profile-index" aria-label="sezioni profilo">
      <p class="eyebrow">sezioni</p>
      ${sections.map(section => html`
        <a
          key=${section.id}
          class=${`profile-index-link ${activeId === section.id ? 'active' : ''}`}
          href=${`#${section.id}`}
          onClick=${() => onSelect(section.id)}
        >
          <kbd>${section.index}</kbd> ${section.label}
        </a>
      `)}
    </nav>
  `;
}

export default ProfileIndex;

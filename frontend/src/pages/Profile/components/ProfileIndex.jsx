/**
 * ProfileIndex - indice delle sezioni del profilo. È una tablist verticale:
 * si vede una sola sezione alla volta e la si sceglie da qui. Solo la scheda
 * attiva è raggiungibile con tab, come vuole il modello a schede; le frecce
 * (e home/fine) spostano la selezione in verticale.
 */

import { html } from '../../../utils/htm.js';

const NAVIGATION_KEYS = ['ArrowDown', 'ArrowUp', 'Home', 'End'];

export function ProfileIndex({ sections, activeId = '', onSelect = () => {} }) {
  /* le schede sono keyed e restano montate: sposto solo il fuoco, senza
     rimontare la lista */
  const focusSection = (id) => {
    onSelect(id);
    const tab = document.getElementById(`tab-${id}`);
    if (tab) tab.focus();
  };

  const moveSelection = (event) => {
    if (!NAVIGATION_KEYS.includes(event.key)) return;

    event.preventDefault();

    const current = sections.findIndex(section => section.id === activeId);
    const last = sections.length - 1;
    const from = current === -1 ? 0 : current;

    let next = from;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    else if (event.key === 'ArrowDown') next = from === last ? 0 : from + 1;
    else if (event.key === 'ArrowUp') next = from === 0 ? last : from - 1;

    focusSection(sections[next].id);
  };

  return html`
    <aside class="profile-index" aria-label="sezioni profilo">
      <p class="eyebrow">sezioni</p>

      <div class="profile-index-list" role="tablist" aria-orientation="vertical" onKeyDown=${moveSelection}>
        ${sections.map(section => html`
          <button
            key=${section.id}
            id=${`tab-${section.id}`}
            type="button"
            role="tab"
            class=${`profile-index-link ${activeId === section.id ? 'active' : ''}`}
            aria-selected=${activeId === section.id}
            aria-controls=${`panel-${section.id}`}
            tabindex=${activeId === section.id ? 0 : -1}
            onClick=${() => onSelect(section.id)}
          >
            <kbd>${section.index}</kbd> ${section.label}
          </button>
        `)}
      </div>
    </aside>
  `;
}

export default ProfileIndex;

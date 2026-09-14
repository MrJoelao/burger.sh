/**
 * RestaurantSearch - Search/filter form for restaurants
 * Supports search by name, city, and dish
 */

import { html } from '../../utils/htm.js';
import { TerminalButton } from '../../components/Auth/TerminalButton.jsx';
import { FormMessage } from '../../components/UI/FormMessage.jsx';

export function RestaurantSearch({
  filters = { name: '', city: '', dishName: '' },
  onFilterChange = () => {},
  onSearch = () => {},
  onClear = () => {},
  loading = false
}) {
  return html`
    <section class="search-panel" style=${{ marginBottom: '24px', padding: '16px', border: '1px solid var(--line)', background: 'var(--panel)' }}>
      <${SectionHeading} eyebrow="filtri" title="RICERCA" subtitle="cerca filiali per nome, città o piatto" />

      <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
        <label style=${{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span class="eyebrow">nome filiale</span>
          <input
            type="text"
            placeholder="es. Burger House"
            value=${filters.name}
            onInput=${(e) => onFilterChange('name', e.target.value)}
            style=${{ padding: '11px', border: '1px solid var(--line)', borderRadius: '0', background: '#100e0a', color: 'var(--white)', font: '13px "IBM Plex Mono", Consolas, monospace' }}
          />
        </label>

        <label style=${{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span class="eyebrow">città</span>
          <input
            type="text"
            placeholder="es. Milano"
            value=${filters.city}
            onInput=${(e) => onFilterChange('city', e.target.value)}
            style=${{ padding: '11px', border: '1px solid var(--line)', borderRadius: '0', background: '#100e0a', color: 'var(--white)', font: '13px "IBM Plex Mono", Consolas, monospace' }}
          />
        </label>

        <label style=${{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span class="eyebrow">piatto</span>
          <input
            type="text"
            placeholder="es. Cheeseburger"
            value=${filters.dishName}
            onInput=${(e) => onFilterChange('dishName', e.target.value)}
            style=${{ padding: '11px', border: '1px solid var(--line)', borderRadius: '0', background: '#100e0a', color: 'var(--white)', font: '13px "IBM Plex Mono", Consolas, monospace' }}
          />
        </label>
      </div>

      <div style=${{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
        <${TerminalButton} primary onClick=${onSearch} disabled=${loading}>
          [ enter ] cerca <b>→</b>
        <//>
        <${TerminalButton} onClick=${onClear}>
          [ esc ] reset
        <//>
      </div>
    </section>
  `;
}

export default RestaurantSearch;
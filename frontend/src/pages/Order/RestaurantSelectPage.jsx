/**
 * RestaurantSelectPage - primo passo del wizard d'ordine: si sceglie la
 * filiale. La lista arriva da GET /restaurants (limite alto, il dataset di un
 * corso è piccolo) e il filtro resta lato client su nome e città, così la
 * ricerca non riparte dal server a ogni tasto.
 */

import { useCallback, useState } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { CustomerShell } from '../../components/Layout/CustomerShell.jsx';
import { SectionHeading } from '../../components/UI/SectionHeading.jsx';
import { AsyncBoundary } from '../../components/Console/AsyncBoundary.jsx';
import { WizardSteps } from '../../components/Order/WizardSteps.jsx';
import { restaurantService } from '../../services/restaurantService.js';
import { useOrderStore } from '../../state/orderStore.js';
import { navigate } from '../../router/navigate.js';
import { entityId } from '../../domain/entity.js';
import { useResource } from '../../hooks/useResource.js';

const LIMIT = 100;

export function RestaurantSelectPage() {
  const order = useOrderStore();
  const [filter, setFilter] = useState('');

  const load = useCallback(() => restaurantService.getRestaurants({ limit: LIMIT }), []);
  const restaurants = useResource(load);

  const list = restaurants.response?.data || [];
  const query = filter.trim().toLowerCase();
  const filtered = query
    ? list.filter(candidate => {
        const name = String(candidate.name || '').toLowerCase();
        const city = String(candidate.city || '').toLowerCase();
        return name.includes(query) || city.includes(query);
      })
    : list;

  const selectRestaurant = (restaurant) => {
    if (!order.selectRestaurant(restaurant)) return;
    navigate(`/orders/menu/${entityId(restaurant)}`);
  };

  return html`
    <${CustomerShell} title="ordina" subtitle="passo 1 · filiale">
      <section class="terminal-screen">
        <${WizardSteps} current="restaurant" />

        <${SectionHeading}
          eyebrow="dove vuoi mangiare"
          title="SCEGLI_"
          titleSpan="LA FILIALE"
          subtitle="ogni filiale ha il suo menu: scegli quella che preferisci per continuare"
        />

        <div class="restaurant-search">
          <span class="prompt">$</span>
          <input
            type="search"
            placeholder="cerca filiale per nome o città"
            value=${filter}
            onInput=${(event) => setFilter(event.currentTarget.value)}
          />
        </div>

        <${AsyncBoundary} loading=${restaurants.loading} error=${restaurants.error} label="filiali">
          ${filtered.length === 0
            ? html`
              <div class="queue-empty">
                <p><b>_</b> nessuna filiale${query ? ' con questo filtro' : ''}.</p>
                <p class="muted">${query ? 'Prova a cambiare la ricerca.' : 'Riprova più tardi.'}</p>
              </div>
            `
            : html`
              <div class="restaurant-picker-grid">
                ${filtered.map(candidate => html`
                  <button
                    key=${entityId(candidate)}
                    class="restaurant-choice"
                    type="button"
                    onClick=${() => selectRestaurant(candidate)}
                  >
                    <strong>${candidate.name}</strong>
                    <span>${candidate.city || candidate.address || 'filiale'}</span>
                  </button>
                `)}
              </div>
            `}
        <//>
      </section>
    <//>
  `;
}

export default RestaurantSelectPage;
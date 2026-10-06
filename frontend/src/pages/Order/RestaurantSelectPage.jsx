/**
 * RestaurantSelectPage - primo passo del wizard d'ordine: si sceglie la
 * filiale. La lista arriva da GET /restaurants (limite alto, il dataset di un
 * corso è piccolo) e il filtro resta lato client su nome e città, così la
 * ricerca non riparte dal server a ogni tasto.
 */

import { useCallback, useEffect, useState } from 'preact/hooks';
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
import { nearestRestaurant } from '../../domain/location.js';

const LIMIT = 100;

export function RestaurantSelectPage() {
  const order = useOrderStore();
  const [filter, setFilter] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationState, setLocationState] = useState('idle');

  const load = useCallback(() => restaurantService.getRestaurants({ limit: LIMIT }), []);
  const restaurants = useResource(load);

  const list = restaurants.response?.data || [];
  const nearest = userLocation ? nearestRestaurant(list, userLocation) : null;
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

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationState('unsupported');
      return;
    }

    setLocationState('loading');
    navigator.geolocation.getCurrentPosition(
      position => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationState('ready');
      },
      () => setLocationState('denied'),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  };

  useEffect(() => {
    if (!restaurants.response?.data?.some(restaurant => restaurant.location)) return;
    setLocationState('available');
  }, [restaurants.response]);

  return html`
    <${CustomerShell} title="ordina" subtitle="passo 1 · filiale" wizardMode>
      <section class="terminal-screen">
        <${WizardSteps} current="restaurant" />

        <div class="order-intro">
          <${SectionHeading}
            eyebrow="scegli dove ordinare"
            title="SCEGLI_"
            titleSpan="LA TUA FILIALE"
            subtitle="Cerca per nome o città, oppure usa la tua posizione per trovare la sede più vicina."
          />
        </div>

        <div class="restaurant-search">
          <span class="prompt">$</span>
          <input
            type="search"
            placeholder="cerca filiale per nome o città"
            value=${filter}
            onInput=${(event) => setFilter(event.currentTarget.value)}
          />
          <button class="location-search-button" type="button" onClick=${requestLocation} disabled=${locationState === 'loading'}>
            <span aria-hidden="true">◎</span>
            ${locationState === 'loading' ? 'cerco...' : 'sede più vicina'}
          </button>
        </div>
        ${locationState === 'denied' && html`<p class="location-note">Posizione non disponibile. Puoi cercare manualmente una sede.</p>`}

        <${AsyncBoundary} loading=${restaurants.loading} error=${restaurants.error} label="filiali">
          ${nearest && html`
            <aside class="nearest-branch" aria-label="Filiale più vicina">
              <div class="nearest-map">
                <iframe
                  title=${`Mappa di ${nearest.restaurant.name}`}
                  loading="lazy"
                  src=${`https://www.openstreetmap.org/export/embed.html?layer=mapnik&marker=${nearest.restaurant.location.lat},${nearest.restaurant.location.lng}`}
                />
              </div>
              <div class="nearest-copy">
                <p class="eyebrow">consigliata per te</p>
                <h2>${nearest.restaurant.name}</h2>
                <p>${nearest.restaurant.address || nearest.restaurant.city || 'indirizzo non disponibile'}</p>
                <strong>${nearest.distanceKm < 1 ? `${Math.round(nearest.distanceKm * 1000)} m` : `${nearest.distanceKm.toFixed(1)} km`} di distanza</strong>
                <a class="map-credit" href=${`https://www.openstreetmap.org/?mlat=${nearest.restaurant.location.lat}&mlon=${nearest.restaurant.location.lng}#map=16/${nearest.restaurant.location.lat}/${nearest.restaurant.location.lng}`} target="_blank" rel="noreferrer">
                  apri la mappa in OpenStreetMap ↗
                </a>
                <button class="terminal-button primary" type="button" onClick=${() => selectRestaurant(nearest.restaurant)}>
                  [ enter ] scegli questa sede
                </button>
              </div>
            </aside>
          `}
          ${locationState === 'ready' && !nearest && html`
            <p class="location-note">Nessuna filiale ha ancora coordinate disponibili. Puoi comunque scegliere dalla lista.</p>
          `}
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
                    <span class="restaurant-choice-index" aria-hidden="true">sede disponibile</span>
                    <strong>${candidate.name}</strong>
                    <span>${candidate.city || candidate.address || 'filiale'}</span>
                    <span class="restaurant-choice-action">apri il menu <b aria-hidden="true">→</b></span>
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
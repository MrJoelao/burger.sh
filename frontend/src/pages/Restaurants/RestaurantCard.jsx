/**
 * RestaurantCard - Individual restaurant display card
 * Shows name, address, city, status, and action button
 */

import { html } from '../../utils/htm.js';
import { TerminalButton } from '../../components/Auth/TerminalButton.jsx';
import { SectionHeading } from '../../components/UI/SectionHeading.jsx';

export function RestaurantCard({
  restaurant = {
    id: '1',
    name: 'Burger House Duomo',
    address: 'Piazza Duomo 1',
    city: 'Milano',
    phone: '+39 02 1234567',
    vatNumber: 'IT12345678901',
    isOpen: true,
    managerName: 'Luca Bianchi'
  },
  onSelect = () => {}
}) {
  return html`
    <article class="card" onClick=${() => onSelect(restaurant)}>
      <div class="card-header">
        <${SectionHeading}
          title=${restaurant.name}
          titleSpan=${" / " + restaurant.city}
          eyebrow="filiale"
        />
      </div>
      <div class="card-body">
        <div style=${{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <span class="eyebrow">indirizzo</span>
            <p>${restaurant.address}, ${restaurant.city}</p>
          </div>
          <div>
            <span class="eyebrow">contatto</span>
            <p>${restaurant.phone}</p>
          </div>
          <div>
            <span class="eyebrow">manager</span>
            <p>${restaurant.managerName || 'Non assegnato'}</p>
          </div>
          <div style=${{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <span class="badge badge-status ${restaurant.isOpen ? 'badge-open' : 'badge-closed'}">
              ${restaurant.isOpen ? 'APERTO' : 'CHIUSO'}
            </span>
            <span class="eyebrow">PIVA: ${restaurant.vatNumber}</span>
          </div>
        </div>
        <div class="card-footer" style=${{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <${TerminalButton} primary onClick=${(e) => { e.stopPropagation(); onSelect(restaurant); }}>
            [ enter ] visualizza menu <b>→</b>
          <//>
        </div>
      </div>
    </article>
  `;
}

export default RestaurantCard;
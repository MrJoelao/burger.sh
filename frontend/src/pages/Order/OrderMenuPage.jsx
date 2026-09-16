/**
 * OrderMenuPage - secondo passo del wizard: il menu della filiale scelta,
 * diviso per sezioni (panini, sides, bevande e le tipologie della filiale).
 * Si aggiungono piatti al carrello con i controlli quantità; il buffer a fianco
 * riassume l ordine e porta al pagamento.
 */

import { useCallback, useEffect, useState } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { CustomerShell } from '../../components/Layout/CustomerShell.jsx';
import { SectionHeading } from '../../components/UI/SectionHeading.jsx';
import { AsyncBoundary } from '../../components/Console/AsyncBoundary.jsx';
import { WizardSteps } from '../../components/Order/WizardSteps.jsx';
import { OrderBuffer } from '../../components/Layout/OrderBuffer.jsx';
import { restaurantService } from '../../services/restaurantService.js';
import { useOrderStore } from '../../state/orderStore.js';
import { navigate } from '../../router/navigate.js';
import { entityId } from '../../domain/entity.js';
import { euro } from '../../domain/format.js';
import { menuSections } from '../../domain/menu.js';
import { addGuestCartItem, changeGuestCartQuantity, guestCartFor, saveGuestCart } from '../../domain/guestCart.js';
import { useResource } from '../../hooks/useResource.js';
import { useAuthStore } from '../../state/authStore.js';
import { AuthRequiredModal } from '../../components/Auth/AuthRequiredModal.jsx';

const LIMIT = 100;

export function OrderMenuPage({ restaurantId }) {
  const order = useOrderStore();
  const { isAuthenticated } = useAuthStore();
  const [guestItems, setGuestItems] = useState(() => guestCartFor(restaurantId));
  const [showAuthModal, setShowAuthModal] = useState(false);

  const loadRestaurant = useCallback(() => restaurantService.getRestaurant(restaurantId), [restaurantId]);
  const loadDishes = useCallback(() => restaurantService.getDishesByRestaurant(restaurantId, { limit: LIMIT }), [restaurantId]);

  const restaurant = useResource(loadRestaurant);
  const dishes = useResource(loadDishes);

  const data = restaurant.response?.data;
  const sections = menuSections(dishes.response?.data || []);

  /* il carrello in bozza arriva dal backend: sincronizza lo store al montaggio */
  useEffect(() => {
    if (!isAuthenticated) return;
    order.fetchCart();
  }, [isAuthenticated]);

  /* la filiale scelta nel primo passo resta nota allo store */
  useEffect(() => {
    if (data) order.selectRestaurant(data);
  }, [data]);

  useEffect(() => {
    setGuestItems(guestCartFor(restaurantId));
  }, [restaurantId]);

  const updateGuestItems = (update) => {
    setGuestItems(currentItems => {
      const nextItems = update(currentItems);
      saveGuestCart(restaurantId, nextItems);
      return nextItems;
    });
  };

  const items = isAuthenticated ? order.items : guestItems;

  const quantityOf = (dishId) => {
    const item = items.find(candidate => candidate.dishId === dishId);
    return item?.quantity || 0;
  };

  const addDish = (dish) => {
    if (!isAuthenticated) {
      updateGuestItems(items => addGuestCartItem(items, dish));
      return;
    }
    order.addCartItem(restaurantId, entityId(dish), 1);
  };

  const increase = (dishId, quantity) => {
    if (!isAuthenticated) {
      updateGuestItems(items => changeGuestCartQuantity(items, dishId, quantity + 1));
      return;
    }
    order.updateCartItem(dishId, quantity + 1);
  };

  const decrease = (dishId, quantity) => {
    if (!isAuthenticated) {
      updateGuestItems(items => changeGuestCartQuantity(items, dishId, quantity - 1));
      return;
    }
    if (quantity <= 1) {
      order.removeCartItem(dishId);
      return;
    }
    order.updateCartItem(dishId, quantity - 1);
  };

  const clearCart = () => {
    if (!isAuthenticated) {
      updateGuestItems(() => []);
      return;
    }
    order.clearCart();
  };

  const hasItems = items.length > 0;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    navigate('/orders/payment');
  };

  return html`
    <${CustomerShell} title="ordina" subtitle="passo 2 · menu" wizardMode>
      <section class="terminal-screen">
        <${WizardSteps} current="menu" />

        <div class="menu-flow">
          <div>
            <${SectionHeading}
              eyebrow="menu della filiale"
              title=${`MENU_`}
              titleSpan=${data?.name || 'filiale'}
              subtitle="aggiungi i piatti al carrello; il totale si calcola al pagamento"
            />

            <${AsyncBoundary} loading=${dishes.loading} error=${dishes.error} label="menu">
              ${sections.length === 0
                ? html`
                  <div class="queue-empty">
                    <p><b>_</b> nessun piatto disponibile in questa filiale.</p>
                    <p class="muted">Torna alla scelta della filiale o riprova più tardi.</p>
                  </div>
                `
                : html`
                  ${sections.map(section => html`
                    <div class="menu-section" key=${section.type}>
                      <${SectionHeading} eyebrow="sezione" title=${section.label.toUpperCase()} />
                      <ul class="dish-card-grid">
                        ${section.items.map(dish => html`
                          <${DishCard}
                            key=${entityId(dish)}
                            dish=${dish}
                            quantity=${quantityOf(entityId(dish))}
                            onAdd=${() => addDish(dish)}
                            onIncrease=${() => increase(entityId(dish), quantityOf(entityId(dish)))}
                            onDecrease=${() => decrease(entityId(dish), quantityOf(entityId(dish)))}
                          />
                        `)}
                      </ul>
                    </div>
                  `)}
                `}
            <//>

            <div class="shortcut-row">
              <button class="terminal-button compact" type="button" onClick=${() => navigate('/orders')}>[ esc ] cambia filiale</button>
            </div>
          </div>

          <${OrderBuffer}
            items=${items}
            onClear=${clearCart}
            onCheckout=${hasItems ? handleCheckout : null}
            emptyMessage="aggiungi un piatto per iniziare."
          />
        </div>
      </section>
    </${CustomerShell}>
    ${showAuthModal && html`<${AuthRequiredModal} onDismiss=${() => setShowAuthModal(false)} />`}
  `;
}

function DishCard({ dish, quantity, onAdd, onIncrease, onDecrease }) {
  return html`
    <li class="dish-card-item">
      <article class="dish-card" aria-label=${dish.name}>
        <div class="dish-card-media">
          ${dish.photoUrl
            ? html`<img src=${dish.photoUrl} alt=${dish.name} />`
            : html`<span aria-hidden="true">${dish.type || 'menu'}</span>`}
        </div>
        <div class="dish-card-body">
          <div>
            <p class="eyebrow">${dish.type || 'specialità'}</p>
            <h3>${dish.name}</h3>
          </div>
          <p class="dish-card-price">${euro(dish.price)}</p>
        </div>
        <footer class="dish-card-actions">
          ${quantity === 0
            ? html`
              <button class="terminal-button compact" type="button" aria-label=${`aggiungi ${dish.name}`} onClick=${onAdd}>
                [ + ] aggiungi
              </button>
            `
            : html`
              <div class="qty-control" aria-label=${`quantità ${dish.name}`}>
                <button class="terminal-button compact" type="button" aria-label=${`meno ${dish.name}`} onClick=${onDecrease}>[ − ]</button>
                <b class="qty-value">${quantity}×</b>
                <button class="terminal-button compact" type="button" aria-label=${`più ${dish.name}`} onClick=${onIncrease}>[ + ]</button>
              </div>
            `}
        </footer>
      </article>
    </li>
  `;
}

export default OrderMenuPage;
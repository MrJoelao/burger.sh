/**
 * OrderMenuPage - secondo passo del wizard: il menu della filiale scelta,
 * diviso per sezioni (panini, sides, bevande e le tipologie della filiale).
 * Si aggiungono piatti al carrello con i controlli quantità; il buffer a fianco
 * riassume l ordine e porta al pagamento.
 */

import { useCallback, useEffect } from 'preact/hooks';
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
import { useResource } from '../../hooks/useResource.js';

const LIMIT = 100;

export function OrderMenuPage({ restaurantId }) {
  const order = useOrderStore();

  const loadRestaurant = useCallback(() => restaurantService.getRestaurant(restaurantId), [restaurantId]);
  const loadDishes = useCallback(() => restaurantService.getDishesByRestaurant(restaurantId, { limit: LIMIT }), [restaurantId]);

  const restaurant = useResource(loadRestaurant);
  const dishes = useResource(loadDishes);

  const data = restaurant.response?.data;
  const sections = menuSections(dishes.response?.data || []);

  /* il carrello in bozza arriva dal backend: sincronizza lo store al montaggio */
  useEffect(() => {
    order.fetchCart();
  }, []);

  /* la filiale scelta nel primo passo resta nota allo store */
  useEffect(() => {
    if (data) order.selectRestaurant(data);
  }, [data]);

  const quantityOf = (dishId) => {
    const item = order.items.find(candidate => candidate.dishId === dishId);
    return item?.quantity || 0;
  };

  const addDish = (dishId) => {
    order.addCartItem(restaurantId, dishId, 1);
  };

  const increase = (dishId, quantity) => {
    order.updateCartItem(dishId, quantity + 1);
  };

  const decrease = (dishId, quantity) => {
    if (quantity <= 1) {
      order.removeCartItem(dishId);
      return;
    }
    order.updateCartItem(dishId, quantity - 1);
  };

  const hasItems = order.items.length > 0;

  return html`
    <${CustomerShell} title="ordina" subtitle="passo 2 · menu">
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
                      <ul class="dish-rows">
                        ${section.items.map(dish => html`
                          <${DishRow}
                            key=${entityId(dish)}
                            dish=${dish}
                            quantity=${quantityOf(entityId(dish))}
                            onAdd=${() => addDish(entityId(dish))}
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
            items=${order.items}
            onClear=${() => order.clearCart()}
            onCheckout=${hasItems ? () => navigate('/orders/payment') : null}
            emptyMessage="aggiungi un piatto per iniziare."
          />
        </div>
      </section>
    <//>
  `;
}

/* una riga di piatto con il controllo quantità: finché non è nel carrello si
   propone solo l'aggiunta, poi − e + aggiustano le quantità */
function DishRow({ dish, quantity, onAdd, onIncrease, onDecrease }) {
  const id = entityId(dish);

  return html`
    <li class="dish-row">
      <div class="dish-row-info">
        <b>${dish.name}</b>
        <span class="muted">${euro(dish.price)}</span>
      </div>

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
    </li>
  `;
}

export default OrderMenuPage;
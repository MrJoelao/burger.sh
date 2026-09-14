/**
 * MenuPage - Main ordering interface using AssemblyLayout
 * Integrates with OrderContext for state management
 */

import { html } from '../../utils/htm.js';
import { TerminalWindow } from '../../components/Layout/TerminalWindow.jsx';
import { AssemblyLayout } from '../../components/Layout/AssemblyLayout.jsx';
import { RecipeMatrix } from '../../components/Menu/RecipeMatrix.jsx';
import { useOrderStore } from '../../state/orderStore.js';
import { restaurantService } from '../../services/restaurantService.js';
import { useEffect, useState } from 'preact/hooks';
import { useAuthStore } from '../../state/authStore.js';

export function MenuPage() {
  const order = useOrderStore();
  const { isAuthenticated } = useAuthStore();
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState('');
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    let cancelled = false;
    restaurantService.getRestaurants({ limit: 50 })
      .then((restaurantResponse) => {
        if (cancelled) return;
        if (!restaurantResponse.success) {
          throw new Error(restaurantResponse.message || 'Impossibile caricare le filiali');
        }
        const availableRestaurants = restaurantResponse.data || [];
        setRestaurants(availableRestaurants);
        if (availableRestaurants.length === 1) {
          order.selectRestaurant(availableRestaurants[0]);
        }
      })
      .catch((error) => {
        if (!cancelled) setMenuError(error.message);
      })
      .finally(() => {
        if (!cancelled) setMenuLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!order.selectedRestaurant) {
      setMenuLoading(false);
      return undefined;
    }

    let cancelled = false;
    setMenuLoading(true);
    setMenuError('');
    restaurantService.getDishesByRestaurant(
      order.selectedRestaurant.id || order.selectedRestaurant._id,
      { type: 'burger', limit: 50 }
    )
      .then((dishResponse) => {
        if (cancelled) return;
        if (!dishResponse.success) {
          throw new Error(dishResponse.message || 'Menu non disponibile');
        }
        const recipes = (dishResponse.data || []).map((dish, index) => ({
          id: dish.id || dish._id,
          restaurantId: dish.restaurantId,
          code: `B-${String(index + 1).padStart(2, '0')} / ${dish.type?.toUpperCase() || 'MENU'}`,
          name: dish.name.toUpperCase(),
          description: `${dish.type || 'Piatto'} della selezione burger.sh.`,
          price: Number(dish.price)
        }));
        order.setRecipes(recipes);
        if (!recipes.length) setMenuError('Nessun piatto disponibile in questa filiale.');
      })
      .catch((error) => {
        if (!cancelled) {
          order.setRecipes([]);
          setMenuError(error.message);
        }
      })
      .finally(() => {
        if (!cancelled) setMenuLoading(false);
      });
    return () => { cancelled = true; };
  }, [order.selectedRestaurant]);

  useEffect(() => {
    if (!isAuthenticated) return;
    order.fetchCart().catch((error) => setMenuError(error.message));
  }, [isAuthenticated]);

  const handleRecipeSelect = (index, recipe) => {
    order.selectRecipe(index, recipe);
  };

  const handleQuantityChange = (newQuantity) => {
    order.setQuantity(newQuantity);
  };

  const handleAddToBuffer = async () => {
    const restaurantId = order.selectedRestaurant?.id || order.selectedRestaurant?._id;
    const dishId = order.selectedRecipe?.id;
    if (isAuthenticated && !restaurantId) {
      setMenuError('Nessuna filiale disponibile: il carrello richiede una filiale attiva.');
      return;
    }
    if (isAuthenticated && restaurantId && dishId) {
      await order.addCartItem(restaurantId, dishId, order.quantity);
      return;
    }
    order.addToBuffer();
  };

  const handleClearBuffer = async () => {
    if (!order.items.length) return;
    if (isAuthenticated) {
      await order.clearCart();
      return;
    }
    order.clearBuffer();
  };

  return html`
    <${TerminalWindow}
      title="kitchen-ops"
      subtitle="production console"
      orderItems=${order.items}
      onClearBuffer=${handleClearBuffer}
    >
      ${order.selectedRecipe && html`
        <${AssemblyLayout}
          recipe=${order.selectedRecipe}
          quantity=${order.quantity}
          onQuantityChange=${handleQuantityChange}
          onAddToBuffer=${handleAddToBuffer}
        />
      `}
      ${menuLoading && html`<p class="menu-state">CARICAMENTO MENU...</p>`}
      ${menuError && html`<p class="menu-state menu-state-error">${menuError}</p>`}
      ${!menuLoading && !restaurants.length && !menuError && html`
        <p class="menu-state menu-state-error">Nessuna filiale disponibile. Riprova più tardi.</p>
      `}
      ${!menuLoading && restaurants.length > 1 && html`
        <section class="restaurant-picker" aria-label="Seleziona filiale">
          <p class="eyebrow">prima scegli la filiale</p>
          <div class="restaurant-picker-grid">
            ${restaurants.map((candidate) => {
              const candidateId = candidate.id || candidate._id;
              const selectedId = order.selectedRestaurant?.id || order.selectedRestaurant?._id;
              return html`
                <button
                  class=${`restaurant-choice ${candidateId === selectedId ? 'active' : ''}`}
                  type="button"
                  onClick=${() => {
                    if (!order.selectRestaurant(candidate)) {
                      setMenuError('Svuota il carrello prima di cambiare filiale.');
                    }
                  }}
                >
                  <strong>${candidate.name}</strong>
                  <span>${candidate.city || candidate.address?.city || 'filiale'}</span>
                </button>
              `;
            })}
          </div>
        </section>
      `}
      <${RecipeMatrix}
        recipes=${order.recipes}
        activeIndex=${order.activeRecipeIndex}
        onRecipeSelect=${handleRecipeSelect}
      />
    <//>
  `;
}

export default MenuPage;
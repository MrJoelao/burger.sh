/**
 * MenuPage - Main ordering interface using AssemblyLayout
 * Integrates with OrderContext for state management
 */

import { html } from '../../utils/htm.js';
import { TerminalWindow } from '../../components/Layout/TerminalWindow.jsx';
import { AssemblyLayout } from '../../components/Layout/AssemblyLayout.jsx';
import { BurgerScanner } from '../../components/Menu/BurgerScanner.jsx';
import { SelectionPanel } from '../../components/Order/SelectionPanel.jsx';
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
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      restaurantService.getDishes({ type: 'burger', limit: 50 }),
      restaurantService.getRestaurants({ limit: 50 })
    ])
      .then(([dishResponse, restaurantResponse]) => {
        if (cancelled) return;
        if (!dishResponse.success) throw new Error(dishResponse.message || dishResponse.detail || 'Menu non disponibile');
        const recipes = dishResponse.data.map((dish, index) => ({
          id: dish.id || dish._id,
          restaurantId: dish.restaurantId,
          code: `B-${String(index + 1).padStart(2, '0')} / ${dish.type?.toUpperCase() || 'MENU'}`,
          name: dish.name.toUpperCase(),
          description: `${dish.type || 'Piatto'} della selezione burger.sh.`,
          price: Number(dish.price)
        }));
        if (!recipes.length) throw new Error('Il database non contiene piatti disponibili');
        if (restaurantResponse.success && restaurantResponse.data?.length) {
          setRestaurant(restaurantResponse.data[0]);
        }
        order.setRecipes(recipes);
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
    const restaurantId = restaurant?.id || restaurant?._id;
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
      <${AssemblyLayout}
        recipe=${order.selectedRecipe}
        quantity=${order.quantity}
        onQuantityChange=${handleQuantityChange}
        onAddToBuffer=${handleAddToBuffer}
      />
      ${menuLoading && html`<p class="menu-state">CARICAMENTO MENU...</p>`}
      ${menuError && html`<p class="menu-state menu-state-error">${menuError}</p>`}
      <${RecipeMatrix}
        recipes=${order.recipes}
        activeIndex=${order.activeRecipeIndex}
        onRecipeSelect=${handleRecipeSelect}
      />
    <//>
  `;
}

export default MenuPage;
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
import { OrderBuffer } from '../../components/Layout/OrderBuffer.jsx';
import { useOrderStore } from '../../state/orderStore.js';

export function MenuPage() {
  const order = useOrderStore();

  const handleRecipeSelect = (index, recipe) => {
    order.selectRecipe(index, recipe);
  };

  const handleQuantityChange = (newQuantity) => {
    order.setQuantity(newQuantity);
  };

  const handleAddToBuffer = () => {
    order.addToBuffer();
  };

  const handleClearBuffer = () => {
    order.clearBuffer();
  };

  return html`
    <${TerminalWindow} title="kitchen-ops" subtitle="local prototype">
      <${AssemblyLayout}>
        <${BurgerScanner} />
        <${SelectionPanel}
          recipe=${order.selectedRecipe}
          quantity=${order.quantity}
          onQuantityChange=${handleQuantityChange}
          onAddToBuffer=${handleAddToBuffer}
        />
      <//>
      <${RecipeMatrix}
        recipes=${order.recipes}
        activeIndex=${order.activeRecipeIndex}
        onRecipeSelect=${handleRecipeSelect}
      />
      <${OrderBuffer}
        items=${order.items}
        onClear=${handleClearBuffer}
      />
    <//>
  `;
}

export default MenuPage;
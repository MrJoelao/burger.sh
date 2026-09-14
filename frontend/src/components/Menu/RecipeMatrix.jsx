/**
 * RecipeMatrix - Responsive grid of recipe buttons
 */

import { html } from '../../utils/htm.js';
import { RecipeButton } from './RecipeButton.jsx';

export function RecipeMatrix({
  recipes,
  activeIndex = 0,
  onRecipeSelect = () => {}
}) {
  if (!recipes?.length) return null;

  return html`
    <div class="recipe-matrix" aria-label="Ricette disponibili">
      ${recipes.map((recipe, index) => html`
        <${RecipeButton}
          code=${recipe.code}
          name=${recipe.name}
          description=${recipe.description}
          price=${recipe.price}
          active=${index === activeIndex}
          onClick=${() => onRecipeSelect(index, recipe)}
        />
      `)}
    </div>
  `;
}

export default RecipeMatrix;
/**
 * RecipeMatrix - Responsive grid of recipe buttons
 */

import { html } from '../../utils/htm.js';
import { RecipeButton } from './RecipeButton.jsx';

export function RecipeMatrix({
  recipes = [
    { code: 'B-01 / CORE', name: 'SMASH CLASSIC', description: 'Doppio smash di manzo, cheddar fuso, cipolla, cetriolini e salsa della casa.', price: 10.50 },
    { code: 'B-02 / HEAT', name: 'HOT SIGNAL', description: 'Manzo alla piastra, jalapeño, cheddar, cipolla croccante e salsa habanero.', price: 11.50 },
    { code: 'B-03 / GREEN', name: 'GREEN MACHINE', description: 'Patty vegetale, lattuga, cipolla, pomodoro e maionese al lime.', price: 9.50 },
    { code: 'B-04 / BIRD', name: 'CRISPY BIRD', description: 'Pollo fritto, cavolo marinato, lattuga e maionese affumicata.', price: 10.00 }
  ],
  activeIndex = 0,
  onRecipeSelect = () => {}
}) {
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
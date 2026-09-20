/**
 * AssemblyLayout - Split layout for order composition
 * Contains BurgerScanner (visual diagram) and SelectionPanel
 */

import { html } from '../../utils/htm.js';
import { Fragment } from 'preact';
import { BurgerScanner } from '../Menu/BurgerScanner.jsx';
import { SelectionPanel } from '../Order/SelectionPanel.jsx';

export function AssemblyLayout({
  recipe,
  quantity,
  onQuantityChange,
  onAddToBuffer
}) {
  return html`
    <${Fragment}>
    <section class="terminal-screen" id="screen-order" aria-label="Assembly station">
      <header class="section-heading">
        <p class="eyebrow">select a unit</p>
        <h2>ASSEMBLY_<span>STATION</span></h2>
        <p class="subline">scegli una ricetta, modifica la quantità, invia al buffer.</p>
      </header>

      <div class="assembly-layout">
        <${BurgerScanner} />

        <${SelectionPanel}
          recipe=${recipe}
          quantity=${quantity}
          onQuantityChange=${onQuantityChange}
          onAddToBuffer=${onAddToBuffer}
        />
      </div>

    </section>

    <//>
  `;
}

export default AssemblyLayout;
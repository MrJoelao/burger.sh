/**
 * AssemblyLayout - Split layout for order composition
 * Contains BurgerScanner (visual diagram) and SelectionPanel
 */

import { html } from '../../utils/htm.js';
import { Fragment } from 'preact';
import { SelectionPanel } from '../Order/SelectionPanel.jsx';

export function AssemblyLayout({
  scannerProps = {},
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
        <div class="burger-scanner" aria-label="Diagramma del burger selezionato" ...${scannerProps}>
          <p class="diagram-label">[ live construction diagram ]</p>
          <div class="crosshair" aria-hidden="true"></div>
          <div class="burger-art" aria-hidden="true">
            <div class="bun top-bun"></div>
            <div class="ingredient cheese"></div>
            <div class="ingredient onion"></div>
            <div class="ingredient patty"></div>
            <div class="ingredient lettuce"></div>
            <div class="bun bottom-bun"></div>
          </div>
          <div class="callout callout-a"><span>01</span> toasted bun</div>
          <div class="callout callout-b"><span>02</span> selected build</div>
          <div class="callout callout-c"><span>03</span> 160g patty</div>
          <div class="scanner-scale"><span>0</span><i></i><i></i><i></i><i></i><span>100</span></div>
        </div>

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
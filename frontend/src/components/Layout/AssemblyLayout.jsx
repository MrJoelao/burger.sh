/**
 * AssemblyLayout - Split layout for order composition
 * Contains BurgerScanner (visual diagram) and SelectionPanel
 */

import { html } from '../../utils/htm.js';

export function AssemblyLayout({
  scannerProps = {},
  selectionProps = {},
  showStaticScreens = false,
  staticScreenContent = null
}) {
  return html`
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

        <div class="selection-panel" ...${selectionProps}>
          <div class="selected-meta"><span class="eyebrow">active recipe</span><span id="recipe-code">B-01 / CORE</span></div>
          <h3 id="recipe-name">SMASH<br>CLASSIC</h3>
          <p id="recipe-description">Doppio smash di manzo, cheddar fuso, cipolla, cetriolini e salsa della casa.</p>
          <p class="price" id="recipe-price">€ 10.50</p>
          <div class="quantity-control" aria-label="Quantità">
            <span class="eyebrow">quantity</span>
            <button type="button" id="decrease" aria-label="Riduci quantità">−</button><output id="quantity">01</output><button type="button" id="increase" aria-label="Aumenta quantità">+</button>
          </div>
          <button class="buffer-action" id="add-to-buffer" type="button"><span>[ enter ]</span> add to buffer <b id="selected-total">€ 10.50</b></button>
        </div>
      </div>

      <div class="recipe-matrix" aria-label="Ricette disponibili">
        ${Array.from({ length: 4 }, (_, i) => html`
          <button class="recipe ${i === 0 ? 'active' : ''}" type="button"
            data-code="B-0${i+1} / ${['CORE', 'HEAT', 'GREEN', 'BIRD'][i]}"
            data-name="${['SMASH CLASSIC', 'HOT SIGNAL', 'GREEN MACHINE', 'CRISPY BIRD'][i]}"
            data-description="${[
              'Doppio smash di manzo, cheddar fuso, cipolla, cetriolini e salsa della casa.',
              'Manzo alla piastra, jalapeño, cheddar, cipolla croccante e salsa habanero.',
              'Patty vegetale, lattuga, cipolla, pomodoro e maionese al lime.',
              'Pollo fritto, cavolo marinato, lattuga e maionese affumicata.'
            ][i]}"
            data-price="${['10.50', '11.50', '9.50', '10.00'][i]}"
          >
            <span><b>0${i+1}</b> ${['core', 'heat', 'green', 'bird'][i]} unit</span>
            <strong>${['smash classic', 'hot signal', 'green machine', 'crispy bird'][i]}</strong>
            <em>€ ${['10.50', '11.50', '9.50', '10.00'][i]}</em>
          </button>
        `)}
      </div>
    </section>

    ${showStaticScreens && staticScreenContent && html`
      <section class="terminal-screen hidden" id="screen-static" aria-live="polite">
        <header class="section-heading">
          <p class="eyebrow">read only</p>
          <h2>${staticScreenContent.title}</h2>
        </header>
        <div class="static-content" id="static-content">
          ${staticScreenContent.content}
        </div>
      </section>
    `}
  `;
}

export default AssemblyLayout;
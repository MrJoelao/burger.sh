/**
 * BurgerScanner - Visual burger diagram with crosshair, callouts, and scale
 */

import { html } from '../../utils/htm.js';

export function BurgerScanner({
  showCallouts = true,
  showScale = true,
  callouts = [
    { id: 'a', label: '01', text: 'toasted bun', top: '70px', left: '16px' },
    { id: 'b', label: '02', text: 'selected build', right: '14px', top: '158px' },
    { id: 'c', label: '03', text: '160g patty', bottom: '55px', left: '16px' }
  ]
}) {
  return html`
    <div class="burger-scanner" aria-label="Diagramma del burger selezionato">
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

      ${showCallouts && callouts.map(callout => html`
        <div class="callout callout-${callout.id}" style=${{
          top: callout.top,
          right: callout.right,
          bottom: callout.bottom,
          left: callout.left
        }}>
          <span>${callout.label}</span> ${callout.text}
        </div>
      `)}

      ${showScale && html`
        <div class="scanner-scale"><span>0</span><i></i><i></i><i></i><i></i><span>100</span></div>
      `}
    </div>
  `;
}

export default BurgerScanner;
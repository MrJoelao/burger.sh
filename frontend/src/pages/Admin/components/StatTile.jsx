/**
 * StatTile - una metrica con il suo totale e, quando c'è, il metro di
 * composizione. Il numero usa il font display, la legenda resta mono.
 */

import { html } from '../../../utils/htm.js';
import { MeterBar } from './MeterBar.jsx';

const numberFormat = new Intl.NumberFormat('it-IT');

export function StatTile({ eyebrow, value, caption = '', segments = [] }) {
  return html`
    <article class="telemetry-card">
      <p class="eyebrow">${eyebrow}</p>
      <p class="telemetry-value">${numberFormat.format(value)}</p>
      ${caption && html`<p class="telemetry-caption">${caption}</p>`}
      <${MeterBar} segments=${segments} />
    </article>
  `;
}

export default StatTile;

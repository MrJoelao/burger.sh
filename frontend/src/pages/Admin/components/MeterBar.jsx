/**
 * MeterBar - barra di composizione in stile terminale. Mostra come si scompone
 * un totale in segmenti proporzionali, con la legenda dei valori sotto. È
 * l'elemento su cui cade l'occhio nella dashboard: il numero dice quanto, la
 * barra dice di cosa è fatto.
 */

import { html } from '../../../utils/htm.js';
import { totalOf } from '../../../domain/admin.js';

export function MeterBar({ segments = [], label = '' }) {
  const total = totalOf(segments);
  if (total === 0) return null;

  return html`
    <div class="meter">
      <div class="meter-track" role="img" aria-label=${label || legendText(segments)}>
        ${segments.map(segment => html`
          <i
            class=${`meter-segment tone-${segment.tone || 'dirty'}`}
            style=${{ '--share': `${(segment.value / total) * 100}%` }}
          ></i>
        `)}
      </div>
      <ul class="meter-legend">
        ${segments.map(segment => html`
          <li>
            <i class=${`meter-dot tone-${segment.tone || 'dirty'}`} aria-hidden="true"></i>
            <span>${segment.label}</span>
            <b>${segment.value}</b>
          </li>
        `)}
      </ul>
    </div>
  `;
}

function legendText(segments) {
  return segments.map(segment => `${segment.label} ${segment.value}`).join(', ');
}

export default MeterBar;

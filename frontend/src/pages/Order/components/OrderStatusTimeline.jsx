/**
 * OrderStatusTimeline - tappe della preparazione. Il percorso è quello della
 * modalità dell'ordine, non un elenco fisso: il ritiro salta la consegna, il
 * domicilio salta il pronti. Ogni tappa sa se è stata superata, se è quella
 * corrente o se deve ancora arrivare.
 */

import { html } from '../../../utils/htm.js';
import { statusTones } from '../../../domain/tones.js';
import { statusTimeline } from '../../../domain/orders.js';

export function OrderStatusTimeline({ mode, status }) {
  const steps = statusTimeline(mode, status);

  return html`
    <ol class="status-track" aria-label="avanzamento ordine">
      ${steps.map(step => html`
        <li key=${step.status} class=${`status-step step-${step.state} tone-${statusTones[step.status] || 'dirty'}`}>
          <span class="step-dot" aria-hidden="true"></span>
          <span class="step-label">${step.label}</span>
        </li>
      `)}
    </ol>
  `;
}

export default OrderStatusTimeline;

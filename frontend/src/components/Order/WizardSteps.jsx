/**
 * WizardSteps - indicatore dei passi del flusso d'ordine del cliente: filiale,
 * menu, pagamento. Ogni pagina del wizard passa il proprio passo come corrente.
 */

import { html } from '../../utils/htm.js';

export const ORDER_WIZARD_STEPS = [
  { id: 'restaurant', label: 'filiale' },
  { id: 'menu', label: 'menu' },
  { id: 'payment', label: 'pagamento' }
];

export function WizardSteps({ current = '', steps = ORDER_WIZARD_STEPS }) {
  return html`
    <ol class="wizard-steps" aria-label="passi dell’ordine">
      ${steps.map((step, index) => html`
        <li
          key=${step.id}
          class=${`wizard-step ${step.id === current ? 'current' : ''}`}
          aria-current=${step.id === current ? 'step' : undefined}
        >
          <span class="wizard-step-index">${String(index + 1).padStart(2, '0')}</span>
          <span class="wizard-step-label">${step.label}</span>
        </li>
      `)}
    </ol>
  `;
}

export default WizardSteps;
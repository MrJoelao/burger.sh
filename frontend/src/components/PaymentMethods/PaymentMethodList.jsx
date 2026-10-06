/**
 * PaymentMethodList - i metodi salvati dal cliente, con le sole ultime quattro
 * cifre di una carta. Ogni riga chiede conferma prima di eliminare; nessuna
 * azione distruttiva con un solo clic.
 */

import { html } from '../../utils/htm.js';
import { ConfirmAction } from '../../components/Console/ConfirmAction.jsx';
import { entityId } from '../../domain/entity.js';
import { paymentMethodSummary, paymentTypeLabels } from '../../domain/payments.js';

export function PaymentMethodList({ methods = [], busyId = null, onDelete = () => {} }) {
  if (methods.length === 0) {
    return html`
      <div class="queue-empty">
        <p><b>_</b> nessun metodo di pagamento salvato.</p>
        <p class="muted">Salva una carta per averla pronta al prossimo ordine. Il pagamento resta una simulazione.</p>
      </div>
    `;
  }

  return html`
    <ul class="order-queue">
      ${methods.map(method => {
        const id = entityId(method);

        return html`
          <li class="order-item" key=${id}>
            <header class="order-head">
              <b class="order-code">${method.label || paymentTypeLabels[method.type]}</b>
              <span class=${`tag tone-${method.isDefault ? 'acid' : 'dirty'}`}>
                ${method.isDefault ? 'predefinito' : paymentTypeLabels[method.type]}
              </span>
            </header>
            <p class="order-meta"><span>${paymentMethodSummary(method)}</span></p>
            <footer class="order-foot">
              <${ConfirmAction} label="[ x ] elimina" disabled=${busyId === id} onConfirm=${() => onDelete(id)} />
            </footer>
          </li>
        `;
      })}
    </ul>
  `;
}

export default PaymentMethodList;
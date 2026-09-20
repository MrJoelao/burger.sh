/**
 * PaymentsPanel - i metodi di pagamento dentro il profilo. La gestione è
 * semplice come chiede il progetto: si salva una carta (con le sole ultime
 * quattro cifre), la si elenca e la si elimina. I contanti non si salvano mai:
 * restano un'opzione al momento del pagamento.
 */

import { useCallback } from 'preact/hooks';
import { html } from '../../../utils/htm.js';
import { paymentService } from '../../../services/paymentService.js';
import { Panel } from './Panel.jsx';
import { AsyncBoundary } from '../../../components/Console/AsyncBoundary.jsx';
import { PaymentMethodForm } from '../../../components/PaymentMethods/PaymentMethodForm.jsx';
import { PaymentMethodList } from '../../../components/PaymentMethods/PaymentMethodList.jsx';
import { useResource, useAction } from '../../../hooks/useResource.js';

export function PaymentsPanel({ active = true }) {
  const load = useCallback(() => paymentService.list(), []);
  const methods = useResource(load);
  const action = useAction({ onSuccess: methods.reload });

  const list = methods.response?.data || [];

  const create = async (payload) => {
    const created = await action.run('create', () => paymentService.create(payload));
    return Boolean(created?.success);
  };

  return html`
    <${Panel} id="pagamenti" eyebrow="pagamenti" title="METODI_" titleSpan="DI PAGAMENTO" active=${active}>
      ${action.actionError && html`<div role="alert" class="alert alert-danger"><strong>errore:</strong> ${action.actionError}</div>`}

      <${AsyncBoundary} loading=${methods.loading} error=${methods.error} label="metodi di pagamento">
        <div class="panel-block">
          <p class="eyebrow">salvati</p>
          <${PaymentMethodList}
            methods=${list}
            busyId=${action.busyId}
            onDelete=${id => action.run(id, () => paymentService.remove(id))}
          />
        </div>

        <div class="panel-block">
          <p class="eyebrow">aggiungi</p>
          <${PaymentMethodForm}
            busy=${action.busyId === 'create'}
            onSubmit=${create}
          />
        </div>
      <//>
    <//>
  `;
}

export default PaymentsPanel;
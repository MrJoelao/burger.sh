/**
 * PaymentMethodsPage - i metodi di pagamento del cliente. Si salvano, si
 * modificano e si eliminano; il progetto non li usa per addebitare nulla, il
 * pagamento falla alla cassa o alla consegna.
 */

import { useCallback, useState } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { CustomerShell } from '../../components/Layout/CustomerShell.jsx';
import { SectionHeading } from '../../components/UI/SectionHeading.jsx';
import { AsyncBoundary } from '../../components/Console/AsyncBoundary.jsx';
import { paymentService } from '../../services/paymentService.js';
import { entityId } from '../../domain/entity.js';
import { useResource, useAction } from '../../hooks/useResource.js';
import { PaymentMethodForm } from './components/PaymentMethodForm.jsx';
import { PaymentMethodList } from './components/PaymentMethodList.jsx';

export function PaymentMethodsPage() {
  const load = useCallback(() => paymentService.list(), []);
  const methods = useResource(load);
  const action = useAction({ onSuccess: methods.reload });
  const [editing, setEditing] = useState(null);

  const list = methods.response?.data || [];

  const create = async (payload) => {
    const created = await action.run('create', () => paymentService.create(payload));
    return Boolean(created?.success);
  };

  const update = async (payload) => {
    const updated = await action.run(entityId(editing), () => paymentService.update(entityId(editing), payload));
    if (updated?.success) setEditing(null);
    return Boolean(updated?.success);
  };

  return html`
    <${CustomerShell} title="pagamenti" subtitle="metodi salvati">
      <section class="terminal-screen">
        <${SectionHeading}
          eyebrow="checkout"
          title="METODI_"
          titleSpan="DI PAGAMENTO"
          subtitle="carte e contanti salvati sul tuo account"
        />

        ${action.actionError && html`<div class="alert alert-danger" role="alert"><strong>errore:</strong> ${action.actionError}</div>`}

        <${AsyncBoundary} loading=${methods.loading} error=${methods.error} label="metodi di pagamento">
          <div class="panel-block">
            <${SectionHeading} eyebrow="salvati" title="I TUOI_" titleSpan="METODI" />
            <${PaymentMethodList}
              methods=${list}
              busyId=${action.busyId}
              onEdit=${setEditing}
              onDelete=${id => action.run(id, () => paymentService.remove(id))}
            />
          </div>

          <div class="panel-block">
            <${SectionHeading}
              eyebrow=${editing ? 'modifica' : 'nuovo'}
              title=${editing ? 'MODIFICA_' : 'AGGIUNGI_'}
              titleSpan=${editing ? 'METODO' : 'UN METODO'}
            />
            <${PaymentMethodForm}
              key=${entityId(editing) || 'new'}
              method=${editing}
              busy=${action.busyId === 'create' || action.busyId === entityId(editing)}
              onSubmit=${editing ? update : create}
            />
            ${editing && html`
              <div class="shortcut-row">
                <button class="terminal-button compact" type="button" onClick=${() => setEditing(null)}>[ esc ] annulla modifica</button>
              </div>
            `}
          </div>
        <//>
      </section>
    <//>
  `;
}

export default PaymentMethodsPage;

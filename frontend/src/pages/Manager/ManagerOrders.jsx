/**
 * ManagerOrders - coda degli ordini della filiale.
 * Carica dal server gli ordini della sede già filtrati per stato, così il filtro
 * attraversa l'intera filiale e non solo la prima pagina, e lascia avanzare solo
 * la transizione ammessa per la modalità dell'ordine.
 */

import { useCallback, useState } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { ManagerShell } from '../../components/Layout/ManagerShell.jsx';
import { SectionHeading } from '../../components/UI/SectionHeading.jsx';
import { managerAdminService } from '../../services/managerAdminService.js';
import { useAuthStore } from '../../state/authStore.js';
import { branchIdOf } from '../../domain/branch.js';
import { useResource, useAction } from '../../hooks/useResource.js';
import { BranchGate } from './components/BranchGate.jsx';
import { StatusFilter } from './components/StatusFilter.jsx';
import { OrderQueue } from './components/OrderQueue.jsx';

const EMPTY_LIST = { success: true, data: [] };

export function ManagerOrders() {
  const { user } = useAuthStore();
  const branchId = branchIdOf(user);
  const [status, setStatus] = useState('');

  const load = useCallback(
    () => (branchId
      ? managerAdminService.getRestaurantOrders(branchId, { status, limit: 50 })
      : Promise.resolve(EMPTY_LIST)),
    [branchId, status]
  );
  const orders = useResource(load);
  const action = useAction({ onSuccess: orders.reload });

  const advance = (id, next) => action.run(id, () => managerAdminService.updateOrderStatus(id, next));

  return html`
    <${ManagerShell} title="ordini" subtitle="restaurant orders">
      <section class="terminal-screen">
        <${SectionHeading}
          eyebrow="filiale"
          title="ORDINI_"
          titleSpan="RICEVUTI"
          subtitle="avanza ogni ordine lungo il flusso previsto dalla sua modalità"
        />

        ${action.actionError && html`
          <div class="alert alert-danger" role="alert"><strong>errore:</strong> ${action.actionError}</div>
        `}

        <${BranchGate}
          branchId=${branchId}
          loading=${orders.loading}
          error=${orders.error}
          label="ordini"
          area="la coda ordini"
        >
          <div class="filter-row">
            <${StatusFilter} value=${status} onChange=${setStatus} />
          </div>

          <${OrderQueue} orders=${orders.response?.data || []} busyId=${action.busyId} onAdvance=${advance} />
        <//>
      </section>
    <//>
  `;
}

export default ManagerOrders;

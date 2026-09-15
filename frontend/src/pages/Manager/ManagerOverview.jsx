/**
 * ManagerOverview - plancia della filiale.
 * Apre con la scheda della sede, poi la telemetria della giornata (ordini per
 * stato, incassi) e la classifica dei piatti più venduti, con le scorciatoie
 * verso le viste operative.
 */

import { useCallback } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { ManagerShell } from '../../components/Layout/ManagerShell.jsx';
import { SectionHeading } from '../../components/UI/SectionHeading.jsx';
import { TerminalButton } from '../../components/Auth/TerminalButton.jsx';
import { StatTile } from '../../components/Console/StatTile.jsx';
import { managerAdminService } from '../../services/managerAdminService.js';
import { useAuthStore } from '../../state/authStore.js';
import { navigate } from '../../router/navigate.js';
import { orderComposition, totalOf } from '../../domain/analytics.js';
import { statusTones, withTones } from '../../domain/tones.js';
import { euro } from '../../domain/format.js';
import { branchIdOf } from '../../domain/branch.js';
import { useResource } from '../../hooks/useResource.js';
import { BranchGate } from './components/BranchGate.jsx';
import { BranchIdentity } from './components/BranchIdentity.jsx';
import { TopDishes } from './components/TopDishes.jsx';

const EMPTY_DASHBOARD = { success: true, data: { ordersByStatus: {}, revenue: 0, topDishes: [] } };

export function ManagerOverview() {
  const { user } = useAuthStore();
  const branchId = branchIdOf(user);

  const load = useCallback(
    () => (branchId ? managerAdminService.getDashboard(branchId) : Promise.resolve(EMPTY_DASHBOARD)),
    [branchId]
  );
  const dashboard = useResource(load);

  return html`
    <${ManagerShell} title="dashboard" subtitle="restaurant control">
      <section class="terminal-screen">
        <${SectionHeading}
          eyebrow="filiale"
          title="PANNELLO_"
          titleSpan="FILIALE"
          subtitle="ordini, incassi e piatti più venduti della tua sede"
        />

        <${BranchGate}
          branchId=${branchId}
          loading=${dashboard.loading}
          error=${dashboard.error}
          label="dashboard"
          area="il pannello"
        >
          ${renderDashboard(dashboard.response?.data || {}, user)}
        <//>
      </section>
    <//>
  `;
}

function renderDashboard(data, user) {
  const orderSegments = withTones(orderComposition(data.ordersByStatus), statusTones);

  return html`
    <div class="panel-block">
      <${BranchIdentity}
        branch=${user?.restaurant || {}}
        managerStatus=${user?.managerStatus}
        managerName=${`${user?.name || ''} ${user?.surname || ''}`.trim()}
      />
    </div>

    <div class="telemetry-rail">
      <${StatTile}
        eyebrow="ordini ricevuti"
        value=${totalOf(orderSegments)}
        segments=${orderSegments}
      />
      <${StatTile}
        eyebrow="incassi"
        value=${data.revenue || 0}
        display=${euro(data.revenue || 0)}
        caption="sui soli ordini consegnati"
      />
      <${StatTile}
        eyebrow="piatti in classifica"
        value=${(data.topDishes || []).length}
        caption="posizioni con almeno una vendita"
      />
    </div>

    <div class="panel-block">
      <${SectionHeading} eyebrow="classifica" title="PIATTI_" titleSpan="PIÙ VENDUTI" />
      <${TopDishes} dishes=${data.topDishes || []} />
    </div>

    <div class="panel-block">
      <${SectionHeading} eyebrow="strumenti" title="GESTIONE_" titleSpan="SEDE" />
      <div class="shortcut-row">
        <${TerminalButton} onClick=${() => navigate('/manager/orders')}>[ 1 ] ordini<//>
        <${TerminalButton} onClick=${() => navigate('/manager/menu')}>[ 2 ] menu<//>
        <${TerminalButton} onClick=${() => navigate('/manager/restaurant')}>[ 3 ] sede<//>
      </div>
    </div>
  `;
}

export default ManagerOverview;

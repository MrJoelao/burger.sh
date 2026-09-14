/**
 * AdminOverview - plancia di controllo dell'admin.
 * Apre con la telemetria della piattaforma, poi la coda dei manager da
 * approvare (il compito principale secondo i docs), le scorciatoie verso le
 * viste di dettaglio e la console di debug.
 */

import { useCallback } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { AdminShell } from '../../components/Layout/AdminShell.jsx';
import { SectionHeading } from '../../components/UI/SectionHeading.jsx';
import { TerminalButton } from '../../components/Auth/TerminalButton.jsx';
import { managerAdminService } from '../../services/managerAdminService.js';
import { navigate } from '../../router/navigate.js';
import { userQuery, roleComposition, orderComposition } from '../../domain/admin.js';
import { roleTones, statusTones, withTones } from './tones.js';
import { useAdminResource, useAdminAction } from './hooks.js';
import { AsyncBoundary } from './components/AsyncBoundary.jsx';
import { StatTile } from './components/StatTile.jsx';
import { ManagerQueue } from './components/ManagerQueue.jsx';
import { DebugConsole } from './DebugConsole.jsx';

export function AdminOverview() {
  const stats = useAdminResource(useCallback(() => managerAdminService.getStats(), []));
  const pending = useAdminResource(
    useCallback(() => managerAdminService.getAllUsers(userQuery({ role: 'manager', managerStatus: 'pending' })), [])
  );
  const action = useAdminAction({ onSuccess: pending.reload });

  const decide = (id, managerStatus) => action.run(id, () => managerAdminService.updateUser(id, { managerStatus }));

  return html`
    <${AdminShell} title="dashboard" subtitle="platform control">
      <section class="terminal-screen">
        <${SectionHeading}
          eyebrow="admin"
          title="PANNELLO_"
          titleSpan="DI CONTROLLO"
          subtitle="telemetria della piattaforma e coda delle approvazioni"
        />

        ${action.actionError && html`
          <div class="alert alert-danger" role="alert"><strong>errore:</strong> ${action.actionError}</div>
        `}

        <${AsyncBoundary} loading=${stats.loading} error=${stats.error} label="telemetria">
          ${renderTelemetry(stats.response?.data || {})}
        <//>

        <div class="panel-block">
          <${SectionHeading} eyebrow="coda" title="MANAGER_" titleSpan="IN ATTESA" />
          <${AsyncBoundary} loading=${pending.loading} error=${pending.error} label="manager">
            <${ManagerQueue}
              managers=${pending.response?.data || []}
              busyId=${action.busyId}
              onApprove=${(id) => decide(id, 'approved')}
              onReject=${(id) => decide(id, 'rejected')}
            />
          <//>
        </div>

        <div class="panel-block">
          <${SectionHeading} eyebrow="scorciatoie" title="STRUMENTI_" titleSpan="DI DETTAGLIO" />
          <div class="shortcut-row">
            <${TerminalButton} onClick=${() => navigate('/admin/users')}>[ 1 ] utenti<//>
            <${TerminalButton} onClick=${() => navigate('/admin/branches')}>[ 2 ] filiali<//>
            <${TerminalButton} onClick=${() => navigate('/admin/stats')}>[ 3 ] statistiche<//>
          </div>
        </div>

        <${DebugConsole} />
      </section>
    <//>
  `;
}

function renderTelemetry(platform) {
  const users = platform.users || {};
  const orders = platform.orders || {};

  return html`
    <div class="telemetry-rail">
      <${StatTile}
        eyebrow="utenti"
        value=${users.total || 0}
        segments=${withTones(roleComposition(users.byRole), roleTones)}
      />
      <${StatTile}
        eyebrow="filiali"
        value=${platform.restaurants?.total || 0}
        caption="punti vendita attivi nella catena"
      />
      <${StatTile}
        eyebrow="ordini"
        value=${orders.total || 0}
        segments=${withTones(orderComposition(orders.byStatus), statusTones)}
      />
    </div>
  `;
}

export default AdminOverview;

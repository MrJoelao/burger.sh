/**
 * AdminStats - aggregati dell'intera piattaforma.
 * Conteggi di utenti per ruolo, filiali attive e ordini per stato. Le stesse
 * barre di composizione della dashboard, qui con la ripartizione in tabella.
 */

import { useCallback } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { AdminShell } from '../../components/Layout/AdminShell.jsx';
import { SectionHeading } from '../../components/UI/SectionHeading.jsx';
import { managerAdminService } from '../../services/managerAdminService.js';
import { roleComposition, orderComposition } from '../../domain/admin.js';
import { roleTones, statusTones, withTones } from './tones.js';
import { useAdminResource } from './hooks.js';
import { AsyncBoundary } from './components/AsyncBoundary.jsx';
import { StatTile } from './components/StatTile.jsx';

export function AdminStats() {
  const stats = useAdminResource(useCallback(() => managerAdminService.getStats(), []));

  return html`
    <${AdminShell} title="statistiche" subtitle="platform metrics">
      <section class="terminal-screen">
        <${SectionHeading}
          eyebrow="aggregati"
          title="STATISTICHE_"
          titleSpan="PIATTAFORMA"
          subtitle="utenti, filiali e ordini dell'intera catena"
        />

        <${AsyncBoundary} loading=${stats.loading} error=${stats.error} label="statistiche">
          ${renderStats(stats.response?.data || {})}
        <//>
      </section>
    <//>
  `;
}

function renderStats(platform) {
  const users = platform.users || {};
  const orders = platform.orders || {};
  const roleSegments = withTones(roleComposition(users.byRole), roleTones);
  const orderSegments = withTones(orderComposition(orders.byStatus), statusTones);

  return html`
    ${compositionBlock('utenti', users.total || 0, roleSegments)}
    <div class="panel-block">
      <${SectionHeading} eyebrow="filiali" title="PUNTI_" titleSpan="VENDITA" />
      <p class="stat-total"><b>${platform.restaurants?.total || 0}</b> filiali attive</p>
    </div>
    ${compositionBlock('ordini', orders.total || 0, orderSegments)}
  `;
}

function compositionBlock(eyebrow, total, segments) {
  const label = eyebrow.toUpperCase();

  return html`
    <div class="panel-block">
      <${SectionHeading} eyebrow=${eyebrow} title="TOTALE_" titleSpan=${label} />
      <${StatTile} eyebrow=${`${eyebrow} totali`} value=${total} segments=${segments} />
      ${segments.length > 0 && html`
        <div class="table-scroll">
          <table class="composition-table">
            <thead>
              <tr><th>voce</th><th class="num">quantità</th><th class="num">quota</th></tr>
            </thead>
            <tbody>
              ${segments.map(segment => html`
                <tr key=${segment.key}>
                  <td><i class=${`meter-dot tone-${segment.tone}`} aria-hidden="true"></i> ${segment.label}</td>
                  <td class="num">${segment.value}</td>
                  <td class="num">${share(segment.value, total)}%</td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;
}

function share(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export default AdminStats;

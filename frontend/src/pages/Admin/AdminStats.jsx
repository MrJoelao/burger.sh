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
import { roleTones, statusTones, withTones } from '../../domain/tones.js';
import { useResource as useAdminResource } from '../../hooks/useResource.js';
import { AsyncBoundary } from '../../components/Console/AsyncBoundary.jsx';
import { StatTile } from '../../components/Console/StatTile.jsx';

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

export function executiveMetrics(platform = {}) {
  const users = platform.users || {};
  const orders = platform.orders || {};
  const byRole = users.byRole || {};
  const byStatus = orders.byStatus || {};
  const totalOrders = orders.total || 0;
  const totalUsers = users.total || 0;
  const totalBranches = platform.restaurants?.total || 0;

  return {
    activeManagers: byRole.manager || 0,
    openOrders: totalOrders - (byStatus.delivered || 0),
    deliveredRate: share(byStatus.delivered || 0, totalOrders),
    ordersPerUser: totalUsers ? Math.round((totalOrders / totalUsers) * 10) / 10 : 0,
    ordersPerBranch: totalBranches ? Math.round((totalOrders / totalBranches) * 10) / 10 : 0
  };
}

function renderStats(platform) {
  const users = platform.users || {};
  const orders = platform.orders || {};
  const roleSegments = withTones(roleComposition(users.byRole), roleTones);
  const orderSegments = withTones(orderComposition(orders.byStatus), statusTones);
  const metrics = executiveMetrics(platform);

  return html`
    <div class="executive-kpi-grid">
      <${StatTile} eyebrow="manager attivi" value=${metrics.activeManagers} caption="responsabili di filiale" />
      <${StatTile} eyebrow="ordini aperti" value=${metrics.openOrders} caption="fuori dallo stato consegnato" />
      <${StatTile} eyebrow="completamento" value=${metrics.deliveredRate} display=${`${metrics.deliveredRate}%`} caption="ordini consegnati" />
      <${StatTile} eyebrow="filiali attive" value=${platform.restaurants?.total || 0} caption="punti vendita operativi" />
    </div>
    <div class="stats-insight-grid">
      <article class="stats-insight">
        <p class="eyebrow">produttività</p>
        <strong>${metrics.ordersPerBranch}</strong>
        <span>ordini per filiale</span>
      </article>
      <article class="stats-insight">
        <p class="eyebrow">adozione</p>
        <strong>${metrics.ordersPerUser}</strong>
        <span>ordini per utente</span>
      </article>
      <article class="stats-insight">
        <p class="eyebrow">rete</p>
        <strong>${platform.restaurants?.total || 0}</strong>
        <span>filiali operative</span>
      </article>
    </div>
    ${compositionBlock('utenti', users.total || 0, roleSegments)}
    <div class="panel-block">
      <${SectionHeading} eyebrow="filiali" title="PUNTI_" titleSpan="VENDITA" />
      <p class="stat-total"><b>${platform.restaurants?.total || 0}</b> filiali attive</p>
    </div>
    ${compositionBlock('ordini', orders.total || 0, orderSegments)}
    ${barChartBlock('pipeline ordini', orderSegments, orders.total || 0)}
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

function barChartBlock(title, segments, total) {
  return html`
    <div class="panel-block">
      <${SectionHeading} eyebrow="flusso" title="PIPELINE_" titleSpan="ORDINI" subtitle="distribuzione degli ordini per stato corrente" />
      <div class="stats-bar-chart" role="img" aria-label=${`${title}: ${segments.map(segment => `${segment.label} ${segment.value}`).join(', ')}`}>
        ${segments.length === 0
          ? html`<p class="queue-empty"><b>_</b> nessun ordine registrato.</p>`
          : segments.map(segment => html`
            <div class="stats-bar-row" key=${segment.key}>
              <span class="stats-bar-label">${segment.label}</span>
              <div class="stats-bar-track"><i class=${`stats-bar-fill tone-${segment.tone}`} style=${{ '--bar-size': `${share(segment.value, total)}%` }}></i></div>
              <b>${segment.value}</b>
            </div>
          `)}
      </div>
    </div>
  `;
}

export default AdminStats;

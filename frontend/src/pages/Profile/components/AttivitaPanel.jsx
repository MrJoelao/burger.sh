/**
 * AttivitaPanel - i numeri dell'attività del cliente: quanti ordini, quanti in
 * corso, quanti consegnati e quanto speso. La spesa conta solo gli ordini
 * consegnati, come gli incassi lato manager.
 */

import { useCallback } from 'preact/hooks';
import { html } from '../../../utils/htm.js';
import { orderService } from '../../../services/orderService.js';
import { Panel } from './Panel.jsx';
import { StatTile } from '../../../components/Console/StatTile.jsx';
import { AsyncBoundary } from '../../../components/Console/AsyncBoundary.jsx';
import { euro } from '../../../domain/format.js';
import { orderStats } from '../../../domain/orders.js';
import { useResource } from '../../../hooks/useResource.js';

export function AttivitaPanel({ active = true }) {
  const load = useCallback(() => orderService.getUserOrders(), []);
  const orders = useResource(load);

  const list = orders.response?.data || [];
  const stats = orderStats(list);

  return html`
    <${Panel} id="attivita" eyebrow="attività" title="I TUOI_" titleSpan="NUMERI" active=${active}>
      <${AsyncBoundary} loading=${orders.loading} error=${orders.error} label="ordini">
        <div class="telemetry-rail">
          <${StatTile} eyebrow="ordini totali" value=${stats.total} />
          <${StatTile} eyebrow="in corso" value=${stats.current} caption="ancora da ricevere" />
          <${StatTile} eyebrow="consegnati" value=${stats.delivered} />
          <${StatTile} eyebrow="spesa" value=${stats.spent} display=${euro(stats.spent)} caption="sui soli ordini consegnati" />
        </div>
      <//>
    <//>
  `;
}

export default AttivitaPanel;
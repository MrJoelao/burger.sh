/**
 * ManagerDashboard - Orders management and revenue stats
 * Shows orders by status, top dishes, revenue
 */

import { html } from '../../utils/htm.js';
import { useState, useEffect } from 'preact/hooks';
import { TerminalWindow } from '../../components/Layout/TerminalWindow.jsx';
import { SectionHeading } from '../../components/UI/SectionHeading.jsx';
import { useAuthStore } from '../../state/authStore.js';
import { managerAdminService } from '../../services/managerAdminService.js';
const statusLabels = {
  ordered: 'ORDINATO', confirmed: 'CONFERMATO', preparing: 'IN PREPARAZIONE',
  ready: 'PRONTO', delivered: 'CONSEGNATO', cancelled: 'ANNULLATO'
};
import { Loading } from '../../components/UI/Loading.jsx';

export function ManagerDashboard() {
  const [dashboardData, setDashboardData] = useState({
    ordersByStatus: {},
    topDishes: [],
    revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, token } = useAuthStore();

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/orders/restaurant/${user.restaurantId}/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch dashboard');
      }

      const data = await response.json();

      if (data.success) {
        setDashboardData(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user?.restaurantId, token]);

  const formatEuro = (amount) => `€ ${amount.toFixed(2)}`;

  return html`
    <${TerminalWindow} title="dashboard" subtitle="manager">
      <section class="terminal-screen">
        <${SectionHeading} eyebrow="restaurant" title="BENVENUTO_<span>${user.name} (${user.restaurantName || '...'})</span>" />

        ${loading && html`<${Loading} message="CARICAMENTO DATI..." />`}

        ${error && html`
          <div class="alert alert-danger" style=${{ padding: '16px', border: '1px solid var(--alert)', background: 'rgba(240, 108, 69, 0.1)', color: 'var(--alert)', marginBottom: '16px' }}>
            <strong>Errore:</strong> ${error}
          </div>
        `}

        <div class="dashboard-grid" style=${{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style=${{ border: '1px solid var(--line)', padding: '16px', background: 'var(--panel)' }}>
            <${SectionHeading} eyebrow="orders" title="ORDINI_<span>OGGI</span>" />
            <div style=${{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              ${Object.entries(dashboardData.ordersByStatus).map(([status, count]) => html`
                <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed var(--line)' }}>
                  <span style=${{ color: 'var(--white)', textTransform: 'uppercase' }}>${statusLabels[status] || status.toUpperCase()}</span>
                  <span style=${{ color: 'var(--acid)', fontSize: '16px', fontWeight: '600' }}>${count}</span>
                </div>
              `)}
            </div>
          </div>

          <div style=${{ border: '1px solid var(--line)', padding: '16px', background: 'var(--panel)' }}>
            <${SectionHeading} eyebrow="revenue" title="INCASSI_<span>GIORNALIERI</span>" />
            <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', fontSize: '24px', fontWeight: '600', color: 'var(--acid)' }}>
              ${formatEuro(dashboardData.revenue)}
            </div>
          </div>

          <div style=${{ border: '1px solid var(--line)', padding: '16px', background: 'var(--panel)' }}>
            <${SectionHeading} eyebrow="menu" title="PIATTI_<span>PIÙ VENDUTI</span>" />
            <div style=${{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              ${dashboardData.topDishes.slice(0, 5).map((dish, index) => html`
                <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: index < 4 ? '1px dashed var(--line)' : 'none' }}>
                  <div style=${{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style=${{ color: 'var(--acid)', fontSize: '16px', fontWeight: '600' }}>${index + 1}.</span>
                    <span style=${{ color: 'var(--white)' }}>${dish.name}</span>
                  </div>
                  <span style=${{ color: 'var(--white)' }}>${dish.count} venduti</span>
                </div>
              `)}
            </div>
          </div>
        </div>

        <${TerminalButton} onClick={() => window.location.href = '/orders'}>
          [ enter ] gestisci ordini
        <//>
      </section>
    <//>
  `;
}

export default ManagerDashboard;
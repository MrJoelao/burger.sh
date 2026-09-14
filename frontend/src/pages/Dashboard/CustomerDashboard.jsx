/**
 * CustomerDashboard - Customer order history and profile
 * Shows recent orders, profile info, preferences
 */

import { html } from '../../utils/htm.js';
import { useState, useEffect, useContext } from 'preact/hooks';
import { TerminalWindow } from '../../components/Layout/TerminalWindow.jsx';
import { SectionHeading } from '../../components/UI/SectionHeading.jsx';
import { AuthContext } from '../../App.jsx';

export function CustomerDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, token } = useContext(AuthContext);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/orders/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch orders');
      }

      const data = await response.json();

      if (data.success) {
        setOrders(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  const formatEuro = (amount) => `€ ${amount.toFixed(2)}`;

  return html`
    <${TerminalWindow} title="dashboard" subtitle="customer">
      <section class="terminal-screen">
        <${SectionHeading} eyebrow="profile" title="BENVENUTO_<span>${user?.name || '...'}</span>" />

        <div class="dashboard-grid" style=${{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style=${{ border: '1px solid var(--line)', padding: '16px', background: 'var(--panel)' }}>
            <${SectionHeading} eyebrow="info" title="PROFILO" />
            <div style=${{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span class="eyebrow">nome</span>
                <p style=${{ color: 'var(--white)' }}>${user?.name || '...'}</p>
              </div>
              <div>
                <span class="eyebrow">email</span>
                <p style=${{ color: 'var(--white)' }}>${user?.email || '...'}</p>
              </div>
              <div>
                <span class="eyebrow">ruolo</span>
                <p style=${{ color: 'var(--white)', textTransform: 'capitalize' }}>${user?.role || 'customer'}</p>
              </div>
            </div>
          </div>

          <div style=${{ border: '1px solid var(--line)', padding: '16px', background: 'var(--panel)' }}>
            <${SectionHeading} eyebrow="orders" title="ULTIMI_<span>ORDINI</span>" />
            <div style=${{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              ${orders.slice(0, 3).map(order => html`
                <article style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px dashed var(--line)' }}>
                  <div>
                    <b>#${order.id?.slice(-8) || 'N/A'}</b>
                    <small style=${{ display: 'block', color: 'var(--dirty)', fontSize: '10px' }}>${formatDate(order.createdAt)}</small>
                  </div>
                  <div style=${{ textAlign: 'right' }}>
                    <div style=${{ fontSize: '16px', fontWeight: '600', color: 'var(--acid)' }}>${formatEuro(order.totalAmount || 0)}</div>
                    <span class="badge badge-status" style=${{
                      background: statusColors[order.status] || 'var(--dirty)',
                      color: 'var(--ink)',
                      padding: '4px 8px',
                      fontSize: '10px',
                      textTransform: 'uppercase'
                    }}>
                      ${statusLabels[order.status] || order.status.toUpperCase()}
                    </span>
                  </div>
                </article>
              `)}
            </div>
          </div>
        </div>

        <${TerminalButton} onClick={() => window.location.href = '/orders'}>
          [ enter ] vedi tutti gli ordini
        <//>
      </section>
    <//>
  `;
}

export default CustomerDashboard;
/**
 * OrderHistoryPage - Customer order history with status tracking
 * Shows current and past orders
 */

import { html } from '../../utils/htm.js';
import { useState, useEffect } from 'preact/hooks';
import { TerminalWindow } from '../../components/Layout/TerminalWindow.jsx';
import { TerminalButton } from '../../components/Auth/TerminalButton.jsx';
import { SectionHeading } from '../../components/UI/SectionHeading.jsx';
import { Loading } from '../../components/UI/Loading.jsx';
import { orderService } from '../../services/orderService.js';
import { navigate } from '../../router/navigate.js';
import { statusLabels, statusColors } from '../../domain/orderStatus.js';

export function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchOrders = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await orderService.getUserOrders(activeFilter === 'all' ? undefined : activeFilter);

      if (data.success) {
        setOrders(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      setError(err.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeFilter]);

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const formatEuro = (amount) => `€ ${amount.toFixed(2)}`;

  const filterTabs = [
    { id: 'all', label: 'TUTTI' },
    { id: 'current', label: 'IN CORSO' },
    { id: 'past', label: 'CONSEGNATI' }
  ];

  return html`
    <${TerminalWindow} title="order-history" subtitle="customer dashboard">
      <section class="terminal-screen">
        <${SectionHeading} eyebrow="dashboard" title="STORICO_" titleSpan="ORDINI" subtitle="visualizza e traccia i tuoi ordini" />

        <div class="filter-tabs" style=${{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          ${filterTabs.map(tab => html`
            <button
              class="terminal-button ${activeFilter === tab.id ? 'primary' : ''}"
              type="button"
              onClick=${() => setActiveFilter(tab.id)}
            >
              ${tab.label}
            </button>
          `)}
        </div>

        ${loading && html`<${Loading} message="CARICAMENTO ORDINI..." />`}

        ${error && html`
          <div class="alert alert-danger" style=${{ padding: '16px', border: '1px solid var(--alert)', background: 'rgba(240, 108, 69, 0.1)', color: 'var(--alert)', marginBottom: '16px' }}>
            <strong>Errore:</strong> ${error}
          </div>
        `}

        ${!loading && !error && orders.length === 0 && html`
          <div style=${{ textAlign: 'center', padding: '48px', color: 'var(--dirty)' }}>
            <p><b>_</b> nessun ordine ${activeFilter !== 'all' ? `con filtro "${filterTabs.find(t => t.id === activeFilter)?.label}"` : ''}</p>
            <p class="eyebrow">${activeFilter !== 'all' ? 'prova a cambiare filtro' : 'effettua il tuo primo ordine dal menu'}</p>
          </div>
        `}

        <div class="order-list" style=${{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          ${orders.map(order => html`
            <article class="order-card" style=${{ border: '1px solid var(--line)', padding: '16px', background: 'var(--panel)' }}>
              <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <span class="eyebrow">ordine #${(order.id || order._id)?.slice(-8) || 'N/A'}</span>
                  <div style=${{ fontSize: '14px', color: 'var(--white)' }}>
                    ${order.restaurantName || 'Filiale sconosciuta'}
                  </div>
                  <span class="eyebrow">${formatDate(order.createdAt || order.updatedAt)}</span>
                </div>
                <div style=${{ textAlign: 'right' }}>
                  <span
                    class="badge badge-status"
                    style=${{
                      background: statusColors[order.status] || 'var(--dirty)',
                      color: 'var(--ink)',
                      border: 'none',
                      padding: '6px 12px',
                      fontSize: '10px',
                      textTransform: 'uppercase'
                    }}
                  >
                    ${statusLabels[order.status] || order.status.toUpperCase()}
                  </span>
                  <div style=${{ marginTop: '8px', fontSize: '18px', fontWeight: '600', color: 'var(--acid)' }}>
                    ${formatEuro(order.totalAmount || 0)}
                  </div>
                </div>
              </div>

              <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px dashed var(--line)' }}>
                <div style=${{ display: 'flex', gap: '16px', color: 'var(--dirty)', fontSize: '10px', textTransform: 'uppercase' }}>
                  <span>${order.mode === 'delivery' ? '🚚 CONSEGNA' : '🏪 RITIRO'}</span>
                  <span>${order.orderItems?.length || 0} articoli</span>
                </div>
                <${TerminalButton} onClick=${() => navigate('/orders/' + (order.id || order._id))}>
                  [ enter ] dettagli
                <//>
              </div>
            </article>
          `)}
        </div>
      </section>
    <//>
  `;
}

export default OrderHistoryPage;
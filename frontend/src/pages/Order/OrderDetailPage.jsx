/**
 * OrderDetailPage - Single order view with tracking and details
 */

import { html } from '../../utils/htm.js';
import { useState, useEffect } from 'preact/hooks';
import { TerminalWindow } from '../../components/Layout/TerminalWindow.jsx';
import { TerminalButton } from '../../components/Auth/TerminalButton.jsx';
import { SectionHeading } from '../../components/UI/SectionHeading.jsx';
import { Loading } from '../../components/UI/Loading.jsx';
import { orderService } from '../../services/orderService.js';
import { statusLabels, statusColors, statusOrder } from '../../domain/orderStatus.js';

export function OrderDetailPage({ orderId }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrder = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await orderService.getOrder(orderId);

      if (data.success) {
        setOrder(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch order');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const formatEuro = (amount) => `€ ${amount.toFixed(2)}`;

  const getCurrentStatusIndex = () => {
    return statusOrder.indexOf(order?.status);
  };

  if (loading) {
    return html`
      <${TerminalWindow} title="order-detail" subtitle="tracking">
        <section class="terminal-screen" style=${{ textAlign: 'center', padding: '48px' }}>
          <${Loading} message="CARICAMENTO ORDINE..." />
        </section>
      <//>
    `;
  }

  if (error || !order) {
    return html`
      <${TerminalWindow} title="order-detail" subtitle="error">
        <section class="terminal-screen" style=${{ textAlign: 'center', padding: '48px' }}>
          <div style=${{ color: 'var(--alert)' }}>
            <p><b>Errore:</b> ${error || 'Ordine non trovato'}</p>
            <${TerminalButton} onClick={() => window.history.back()} style=${{ marginTop: '16px' }}>
              [ esc ] torna indietro
            <//>
          </div>
        </section>
      <//>
    `;
  }

  const currentStatusIndex = getCurrentStatusIndex();
  // restaurantId arriva come ObjectId oppure come ref popolato (_id, name, city): da qui il nome filiale
  const restaurant = typeof order.restaurantId === 'object' && order.restaurantId !== null ? order.restaurantId : null;

  return html`
    <${TerminalWindow} title="order-detail" subtitle="tracking">
      <section class="terminal-screen">
        <${SectionHeading}
          eyebrow="tracking"
          title="ORDINE_"
          titleSpan=${`#${(order.id || order._id)?.slice(-8) || 'N/A'}`}
          subtitle=${`${restaurant.name || 'Filiale sconosciuta'} · ${formatDate(order.createdAt)}`}
        />

        <div class="status-timeline" style=${{ marginBottom: '24px', padding: '16px', border: '1px solid var(--line)', background: 'var(--panel)' }}>
          <${SectionHeading} eyebrow="progress" title="STATO" subtitle="tracciamento preparazione" />
          <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', position: 'relative' }}>
            <div style=${{ position: 'absolute', top: '50%', left: '10%', right: '10%', height: '2px', background: 'var(--line)', transform: 'translateY(-50%)', zIndex: 1 }} />
            ${statusOrder.map((status, index) => {
              const isActive = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              return html`
                <div style=${{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2, flex: 1 }}>
                  <div style=${{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: isActive ? (statusColors[status] || 'var(--amber)') : 'var(--line)',
                    border: isCurrent ? '2px solid var(--acid)' : 'none',
                    boxShadow: isActive ? `0 0 8px ${statusColors[status] || 'var(--amber)'}` : 'none',
                    transition: 'all 0.3s ease'
                  }} />
                  <span class="eyebrow" style=${{
                    marginTop: '8px',
                    fontSize: '8px',
                    textAlign: 'center',
                    color: isActive ? (statusColors[status] || 'var(--white)') : 'var(--dirty)',
                    whiteSpace: 'nowrap'
                  }}>
                    ${statusLabels[status]}
                  </span>
                </div>
              `;
            })}
          </div>
        </div>

        <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style=${{ border: '1px solid var(--line)', padding: '16px', background: 'var(--panel)' }}>
            <${SectionHeading} eyebrow="details" title="INFO" />
            <div style=${{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span class="eyebrow">modalità</span>
                <p style=${{ color: 'var(--white)', textTransform: 'uppercase' }}>
                  ${order.mode === 'delivery' ? '🚚 Consegna a domicilio' : '🏪 Ritiro in sede'}
                </p>
              </div>
              ${order.delivery?.address && html`
                <div>
                  <span class="eyebrow">indirizzo consegna</span>
                  <p style=${{ color: 'var(--white)' }}>${order.delivery.address}</p>
                </div>
              `}
              <div>
                <span class="eyebrow">totale</span>
                <p style=${{ fontSize: '24px', fontWeight: '600', color: 'var(--acid)' }}>
                  ${formatEuro(order.totalAmount || 0)}
                </p>
              </div>
              <div>
                <span class="eyebrow">articoli</span>
                <p style=${{ color: 'var(--white)' }}>${order.orderItems?.length || 0}</p>
              </div>
            </div>
          </div>

          <div style=${{ border: '1px solid var(--line)', padding: '16px', background: 'var(--panel)' }}>
            <${SectionHeading} eyebrow="filiale" title="RISTORANTE" />
            <div style=${{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <span class="eyebrow">nome</span>
                <p style=${{ color: 'var(--white)' }}>${restaurant.name || 'N/A'}</p>
              </div>
              ${order.restaurantAddress && html`
                <div>
                  <span class="eyebrow">indirizzo</span>
                  <p style=${{ color: 'var(--white)' }}>${order.restaurantAddress}</p>
                </div>
              `}
              ${order.restaurantPhone && html`
                <div>
                  <span class="eyebrow">telefono</span>
                  <p style=${{ color: 'var(--white)' }}>${order.restaurantPhone}</p>
                </div>
              `}
            </div>
          </div>
        </div>

        <div style=${{ border: '1px solid var(--line)', padding: '16px', background: 'var(--panel)' }}>
          <${SectionHeading} eyebrow="items" title="ARTICOLI" subtitle="dettaglio ordine" />
          <div style=${{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            ${order.orderItems?.map((item, index) => html`
              <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: index < (order.orderItems?.length || 0) - 1 ? '1px dashed var(--line)' : 'none' }}>
                <div style=${{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span class="eyebrow" style=${{ minWidth: '30px', color: 'var(--acid)' }}>
                    ${String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <b>${item.dishId?.name || 'Articolo'}</b>
                    <small style=${{ display: 'block', color: 'var(--dirty)', fontSize: '10px' }}>
                      qty ${item.quantity} · ${formatEuro(item.unitPrice || 0)} cad.
                    </small>
                  </div>
                </div>
                <strong style=${{ color: 'var(--acid)', fontSize: '16px' }}>
                  ${formatEuro((item.unitPrice || 0) * (item.quantity || 1))}
                </strong>
              </div>
            `)}
            <div style=${{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--line)', fontSize: '19px' }}>
              <span style=${{ color: 'var(--dirty)', textTransform: 'uppercase' }}>totale</span>
              <strong style=${{ color: 'var(--acid)' }}>${formatEuro(order.totalAmount || 0)}</strong>
            </div>
          </div>
        </div>

        <div style=${{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
          <${TerminalButton} onClick={() => window.history.back()}>
            [ esc ] indietro
          <//>
          ${order.status !== 'delivered' && order.status !== 'cancelled' && html`
            <${TerminalButton} primary onClick=${fetchOrder}>
              [ F5 ] aggiorna stato
            <//>
          `}
        </div>
      </section>
    <//>
  `;
}

export default OrderDetailPage;
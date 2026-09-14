/**
 * OrderConfirmPage - Order confirmation with pickup/delivery selection
 * Address input for delivery mode
 */

import { html } from '../../utils/htm.js';
import { useState, useContext } from 'preact/hooks';
import { TerminalWindow } from '../../components/Layout/TerminalWindow.jsx';
import { TerminalButton } from '../../components/Auth/TerminalButton.jsx';
import { SectionHeading } from '../../components/UI/SectionHeading.jsx';
import { FormMessage } from '../../components/UI/FormMessage.jsx';
import { useOrderStore } from '../../state/orderStore.js';
import { navigate } from '../../router/navigate.js';

export function OrderConfirmPage() {
  const [mode, setMode] = useState('pickup');
  const [address, setAddress] = useState({
    street: '',
    city: '',
    zip: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const order = useOrderStore();

  const formatEuro = (amount) => `€ ${amount.toFixed(2)}`;

  const subtotal = order.items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  // tariffa puramente indicativa: il totale definitivo e' calcolato dal server alla conferma del carrello
  const deliveryFee = mode === 'delivery' ? 3.50 : 0;
  const total = subtotal + deliveryFee;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'delivery' && (!address.street || !address.city || !address.zip)) {
      setError('Completa tutti i campi dell\'indirizzo per la consegna');
      setLoading(false);
      return;
    }

    try {
      const delivery = mode === 'delivery' ? { address: `${address.street}, ${address.city} ${address.zip}` } : undefined;

      const data = await order.confirmCart(mode, delivery);
      if (data.success && data.data) {
        const orderId = data.data.id || data.data._id;
        navigate(orderId ? `/orders/${orderId}` : '/orders');
      } else {
        setError(data.message || 'Errore nella conferma dell\'ordine');
      }
    } catch (err) {
      setError(err.message || 'Errore di connessione. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  return html`
    <${TerminalWindow} title="order-confirm" subtitle="checkout">
      <section class="terminal-screen" style=${{ maxWidth: '700px', margin: '0 auto' }}>
        <${SectionHeading} eyebrow="checkout" title="CONFERMA_<span>ORDINE</span>" subtitle="verifica i dettagli e scegli la modalità" />

        <div style=${{ marginBottom: '24px' }}>
          <div style=${{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <label style=${{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '12px 16px', border: '1px solid var(--line)', background: mode === 'pickup' ? 'var(--amber)' : 'transparent', color: mode === 'pickup' ? 'var(--ink)' : 'var(--white)' }}>
              <input
                type="radio"
                name="mode"
                value="pickup"
                checked=${mode === 'pickup'}
                onChange=${() => setMode('pickup')}
                style=${{ accentColor: 'var(--amber)' }}
              />
              <span style=${{ textTransform: 'uppercase', fontWeight: '600' }}>RITIRO IN SEDE</span>
            </label>
            <label style=${{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '12px 16px', border: '1px solid var(--line)', background: mode === 'delivery' ? 'var(--amber)' : 'transparent', color: mode === 'delivery' ? 'var(--ink)' : 'var(--white)' }}>
              <input
                type="radio"
                name="mode"
                value="delivery"
                checked=${mode === 'delivery'}
                onChange=${() => setMode('delivery')}
                style=${{ accentColor: 'var(--amber)' }}
              />
              <span style=${{ textTransform: 'uppercase', fontWeight: '600' }}>CONSEGNA (+€ 3.50)</span>
            </label>
          </div>

          ${mode === 'delivery' && html`
            <div style=${{ padding: '16px', border: '1px solid var(--line)', background: 'var(--panel)' }}>
              <${SectionHeading} eyebrow="delivery" title="INDIRIZZO" subtitle="dove consegnare l'ordine" />
              <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '16px' }}>
                <label style=${{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span class="eyebrow">via e numero</span>
                  <input
                    type="text"
                    placeholder="Via Roma 1"
                    value=${address.street}
                    onInput=${(e) => setAddress({ ...address, street: e.target.value })}
                    style=${{ padding: '11px', border: '1px solid var(--line)', borderRadius: '0', background: '#100e0a', color: 'var(--white)', font: '13px "IBM Plex Mono", Consolas, monospace' }}
                  />
                </label>
                <label style=${{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span class="eyebrow">città</span>
                  <input
                    type="text"
                    placeholder="Milano"
                    value=${address.city}
                    onInput=${(e) => setAddress({ ...address, city: e.target.value })}
                    style=${{ padding: '11px', border: '1px solid var(--line)', borderRadius: '0', background: '#100e0a', color: 'var(--white)', font: '13px "IBM Plex Mono", Consolas, monospace' }}
                  />
                </label>
                <label style=${{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span class="eyebrow">CAP</span>
                  <input
                    type="text"
                    placeholder="20100"
                    value=${address.zip}
                    onInput=${(e) => setAddress({ ...address, zip: e.target.value })}
                    style=${{ padding: '11px', border: '1px solid var(--line)', borderRadius: '0', background: '#100e0a', color: 'var(--white)', font: '13px "IBM Plex Mono", Consolas, monospace' }}
                  />
                </label>
                <label style=${{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span class="eyebrow">note (opzionale)</span>
                  <input
                    type="text"
                    placeholder="Citofono, piano, istruzioni..."
                    value=${address.notes}
                    onInput=${(e) => setAddress({ ...address, notes: e.target.value })}
                    style=${{ padding: '11px', border: '1px solid var(--line)', borderRadius: '0', background: '#100e0a', color: 'var(--white)', font: '13px "IBM Plex Mono", Consolas, monospace' }}
                  />
                </label>
              </div>
            </div>
          `}
        </div>

        ${error && html`<${FormMessage} message=${error} type="error" />`}

        <div class="order-summary" style=${{ border: '1px solid var(--line)', padding: '16px', marginBottom: '16px' }}>
          <${SectionHeading} eyebrow="summary" title="RIEPILOGO" />
          <div style=${{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            ${order.items.map((item, index) => html`
              <div style=${{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: index < order.items.length - 1 ? '1px dashed var(--line)' : 'none' }}>
                <div>
                  <b>${item.name}</b>
                  <small style=${{ display: 'block', color: 'var(--dirty)', fontSize: '10px' }}>
                    ${item.code} · qty ${item.quantity}
                  </small>
                </div>
                <strong>${formatEuro(item.price * item.quantity)}</strong>
              </div>
            `)}
            <div style=${{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: 'var(--dirty)', fontSize: '10px', textTransform: 'uppercase' }}>
              <span>subtotale</span>
              <b>${formatEuro(subtotal)}</b>
            </div>
            ${mode === 'delivery' && html`
              <div style=${{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: 'var(--dirty)', fontSize: '10px', textTransform: 'uppercase' }}>
                <span>consegna</span>
                <b>${formatEuro(deliveryFee)}</b>
              </div>
            `}
            <div style=${{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--line)', fontSize: '19px' }}>
              <span style=${{ color: 'var(--dirty)', textTransform: 'uppercase' }}>totale</span>
              <strong style=${{ color: 'var(--acid)' }}>${formatEuro(total)}</strong>
            </div>
          </div>
        </div>

        <div style=${{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <${TerminalButton} primary type="submit" onClick=${handleSubmit} disabled=${loading || order.items.length === 0}>
            [ enter ] conferma ordine <b>→</b>
          <//>
          <${TerminalButton} onClick=${() => navigate('/menu')}>
            [ esc ] indietro
          <//>
        </div>

        ${loading && html`
          <div class="loading-indicator" style=${{ textAlign: 'center', padding: '16px', color: 'var(--acid)' }}>
            <span class="spinner">●●●●●●</span> ELABORAZIONE...
          </div>
        `}
      </section>
    <//>
  `;
}

export default OrderConfirmPage;
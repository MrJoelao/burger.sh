/**
 * OrderConfirmPage - checkout del carrello in bozza. La modalità (ritiro o
 * domicilio) e l'eventuale indirizzo si scelgono solo qui: la conferma passa da
 * POST /cart/confirm, che è il server a trasformare in un ordine vero, con
 * totali e costo di consegna calcolati da lui. Il front-end mostra una stima.
 */

import { useState } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { CustomerShell } from '../../components/Layout/CustomerShell.jsx';
import { TerminalButton } from '../../components/Auth/TerminalButton.jsx';
import { SectionHeading } from '../../components/UI/SectionHeading.jsx';
import { FormMessage } from '../../components/UI/FormMessage.jsx';
import { useOrderStore } from '../../state/orderStore.js';
import { navigate } from '../../router/navigate.js';
import { euro } from '../../domain/format.js';

/* tariffa solo indicativa: il totale definitivo arriva dal server alla conferma */
const ESTIMATED_DELIVERY_FEE = 3.5;

const EMPTY_ADDRESS = { street: '', city: '', zip: '', notes: '' };

export function OrderConfirmPage() {
  const order = useOrderStore();
  const [mode, setMode] = useState('pickup');
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const subtotal = order.items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const estimatedTotal = subtotal + (mode === 'delivery' ? ESTIMATED_DELIVERY_FEE : 0);

  const addressComplete = address.street.trim() && address.city.trim() && address.zip.trim();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (mode === 'delivery' && !addressComplete) {
      setError('Completa via, città e CAP per la consegna a domicilio.');
      return;
    }

    setLoading(true);
    try {
      const delivery = mode === 'delivery'
        ? { address: `${address.street}, ${address.city} ${address.zip}` }
        : undefined;

      const response = await order.confirmCart(mode, delivery);
      if (!response?.success || !response.data) {
        setError(response?.message || 'Conferma non riuscita. Riprova.');
        return;
      }

      navigate(`/orders/${response.data.id || response.data._id}`);
    } catch (err) {
      setError(err.message || 'Errore di connessione. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  return html`
    <${CustomerShell} title="checkout" subtitle="conferma ordine">
      <section class="terminal-screen">
        <${SectionHeading} eyebrow="checkout" title="CONFERMA_" titleSpan="ORDINE" subtitle="scegli come ricevere l'ordine" />

        ${order.items.length === 0
          ? html`
            <div class="queue-empty">
              <p><b>_</b> il carrello è vuoto.</p>
              <p class="muted">Scegli qualche piatto dal menu prima di confermare.</p>
              <${TerminalButton} primary onClick=${() => navigate('/menu')}>[ enter ] vai al menu<//>
            </div>
          `
          : renderCheckout({ order, mode, setMode, address, setAddress, error, loading, subtotal, estimatedTotal, handleSubmit })}
      </section>
    <//>
  `;
}

function renderCheckout({ order, mode, setMode, address, setAddress, error, loading, subtotal, estimatedTotal, handleSubmit }) {
  return html`
    <form onSubmit=${handleSubmit}>
      <div class="panel-block">
        <${SectionHeading} eyebrow="modalità" title="RITIRO_" titleSpan="O CONSEGNA" />
        <div class="shortcut-row">
          <${ModeChoice} value="pickup" current=${mode} onSelect=${setMode} label="RITIRO IN SEDE" />
          <${ModeChoice} value="delivery" current=${mode} onSelect=${setMode} label=${`CONSEGNA (+€ ${ESTIMATED_DELIVERY_FEE.toFixed(2)})`} />
        </div>
      </div>

      ${mode === 'delivery' && html`
        <div class="panel-block">
          <${SectionHeading} eyebrow="domicilio" title="INDIRIZZO_" titleSpan="DI CONSEGNA" />
          <div class="profile-grid">
            ${addressFields(address, setAddress)}
          </div>
        </div>
      `}

      ${error && html`<${FormMessage} message=${error} type="error" />`}

      <div class="panel-block">
        <${SectionHeading} eyebrow="riepilogo" title="CARRELLO" subtitle="il totale finale è calcolato dal server" />
        <ul class="order-queue">
          ${order.items.map((item, index) => html`
            <li class="order-item" key=${item.dishId || index}>
              <header class="order-head">
                <b class="order-code">${item.name || 'piatto'}</b>
                <span class="tag tone-amber">${item.quantity}×</span>
              </header>
              <p class="order-meta"><span>${euro(item.price)} cad.</span></p>
              <footer class="order-foot"><b>${euro((item.price || 0) * (item.quantity || 1))}</b></footer>
            </li>
          `)}
        </ul>

        <div class="checkout-totals">
          <p><span>subtotale</span><b>${euro(subtotal)}</b></p>
          ${mode === 'delivery' && html`<p><span>consegna (stima)</span><b>${euro(ESTIMATED_DELIVERY_FEE)}</b></p>`}
          <p class="checkout-grand-total"><span>totale stimato</span><strong>${euro(estimatedTotal)}</strong></p>
        </div>
      </div>

      <div class="shortcut-row">
        <${TerminalButton} primary type="submit" disabled=${loading}>
          [ enter ] conferma ordine →
        <//>
        <${TerminalButton} onClick=${() => navigate('/menu')}>[ esc ] indietro<//>
      </div>
    </form>
  `;
}

function addressFields(address, setAddress) {
  const fields = [
    { name: 'street', label: 'via e numero', placeholder: 'Via Roma 1' },
    { name: 'city', label: 'città', placeholder: 'Milano' },
    { name: 'zip', label: 'cap', placeholder: '20100' },
    { name: 'notes', label: 'note (opzionale)', placeholder: 'Citofono, piano...' }
  ];

  return fields.map(field => html`
    <label class="profile-field" key=${field.name}>
      ${field.label}
      <input
        type="text"
        placeholder=${field.placeholder}
        value=${address[field.name]}
        onInput=${(event) => setAddress(current => ({ ...current, [field.name]: event.currentTarget.value }))}
      />
    </label>
  `);
}

function ModeChoice({ value, current, onSelect, label }) {
  const active = current === value;

  return html`
    <button
      class=${`terminal-button ${active ? 'primary' : ''}`}
      type="button"
      aria-pressed=${active}
      onClick=${() => onSelect(value)}
    >
      ${label}
    </button>
  `;
}

export default OrderConfirmPage;

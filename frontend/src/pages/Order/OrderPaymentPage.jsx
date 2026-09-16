/**
 * OrderPaymentPage - terzo e ultimo passo del wizard: si sceglie come ricevere
 * l'ordine e come pagare. Il pagamento è una simulazione (il progetto non
 * addebita nulla): i contanti restano un'opzione alla cassa senza essere
 * salvati, una carta salvata basta da sola, e una carta nuova viene prima
 * registrata (solo ultime quattro cifre) e poi usata per l'ordine. La conferma
 * passa da POST /cart/confirm, che è il server a calcolare i totali.
 */

import { useCallback, useState } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { CustomerShell } from '../../components/Layout/CustomerShell.jsx';
import { SectionHeading } from '../../components/UI/SectionHeading.jsx';
import { FormMessage } from '../../components/UI/FormMessage.jsx';
import { AsyncBoundary } from '../../components/Console/AsyncBoundary.jsx';
import { WizardSteps } from '../../components/Order/WizardSteps.jsx';
import { CardFields } from '../../components/PaymentMethods/CardFields.jsx';
import { Loading } from '../../components/UI/Loading.jsx';
import { paymentService } from '../../services/paymentService.js';
import { useOrderStore } from '../../state/orderStore.js';
import { navigate } from '../../router/navigate.js';
import { euro } from '../../domain/format.js';
import { entityId } from '../../domain/entity.js';
import { orderReference } from '../../domain/orders.js';
import { cardFormErrors, cardMethodPayload, paymentMethodSummary } from '../../domain/payments.js';
import { useResource } from '../../hooks/useResource.js';

/* tariffa solo indicativa: il totale definitivo arriva dal server alla conferma */
const ESTIMATED_DELIVERY_FEE = 3.5;

const EMPTY_ADDRESS = { street: '', city: '', zip: '', notes: '' };
const EMPTY_CARD = { name: '', surname: '', number: '', expiry: '', cvv: '' };

export function OrderPaymentPage() {
  const order = useOrderStore();
  const [mode, setMode] = useState('pickup');
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [choice, setChoice] = useState('cash');
  const [savedMethodId, setSavedMethodId] = useState('');
  const [newCard, setNewCard] = useState(EMPTY_CARD);
  const [cardErrors, setCardErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  const loadMethods = useCallback(() => paymentService.list(), []);
  const methods = useResource(loadMethods);
  const savedMethods = methods.response?.data || [];

  const items = order.items;
  const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const estimatedTotal = subtotal + (mode === 'delivery' ? ESTIMATED_DELIVERY_FEE : 0);
  const addressComplete = address.street.trim() && address.city.trim() && address.zip.trim();

  const handleConfirm = async (event) => {
    event.preventDefault();
    setError('');

    if (mode === 'delivery' && !addressComplete) {
      setError('Completa via, città e CAP per la consegna a domicilio.');
      return;
    }

    if (choice === 'saved' && !savedMethodId) {
      setError('Scegli quale carta salvata usare.');
      return;
    }

    if (choice === 'new') {
      const found = cardFormErrors(newCard);
      setCardErrors(found);
      if (Object.keys(found).length > 0) return;
    }

    setBusy(true);
    try {
      if (choice === 'new') {
        const created = await paymentService.create(cardMethodPayload(newCard));
        if (!created?.success) {
          setError(created?.message || 'Impossibile salvare la carta. Riprova.');
          return;
        }
      }

      const delivery = mode === 'delivery'
        ? { address: `${address.street}, ${address.city} ${address.zip}` }
        : undefined;

      const response = await order.confirmCart(mode, delivery);
      if (!response?.success || !response.data) {
        setError(response?.message || 'Conferma non riuscita. Riprova.');
        return;
      }

      setDone(response.data);
    } catch (err) {
      setError(err.message || 'Errore di connessione. Riprova.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return html`
      <${CustomerShell} title="ordina" subtitle="ordine confermato">
        <section class="terminal-screen">
          <${WizardSteps} current="payment" />
          <div class="queue-empty order-success">
            <p><b>✓</b> ordine confermato.</p>
            <h2 class="order-code-large">${orderReference(done)}</h2>
            <p class="muted">pagamento simulato: non è stato addebitato nulla.</p>
            <div class="shortcut-row">
              <button class="terminal-button primary" type="button" onClick=${() => navigate(`/orders/${entityId(done)}`)}>[ enter ] segui l'ordine</button>
              <button class="terminal-button" type="button" onClick=${() => navigate('/profile')}>[ esc ] profilo</button>
            </div>
          </div>
        </section>
      <//>
    `;
  }

  const displayLoading = (order.loading || methods.loading) && items.length === 0 && !subtotal;

  return html`
    <${CustomerShell} title="ordina" subtitle="passo 3 · pagamento">
      <section class="terminal-screen">
        <${WizardSteps} current="payment" />

        ${displayLoading
          ? html`<${Loading} message="caricamento carrello..." />`
          : items.length === 0
            ? html`
              <div class="queue-empty">
                <p><b>_</b> il carrello è vuoto.</p>
                <p class="muted">Scegli qualche piatto dal menu prima di pagare.</p>
                <button class="terminal-button primary" type="button" onClick=${() => navigate('/orders')}>[ enter ] scegli una filiale</button>
              </div>
            `
            : renderPayment({
                order,
                mode, setMode,
                address, setAddress,
                choice, setChoice,
                savedMethodId, setSavedMethodId,
                savedMethods, methodsError: methods.error,
                newCard, setNewCard, cardErrors, setCardErrors,
                error, busy,
                items, subtotal, estimatedTotal,
                addressComplete,
                handleConfirm
              })
        }
      </section>
    <//>
  `;
}

function renderPayment(props) {
  const {
    items, subtotal, estimatedTotal, mode, error, busy, choice,
    savedMethods, methodsError,
    address, setAddress, setMode, setChoice,
    savedMethodId, setSavedMethodId,
    newCard, setNewCard, cardErrors, setCardErrors,
    handleConfirm
  } = props;

  return html`
    <${SectionHeading}
      eyebrow="pagamento"
      title="CONFERMA_"
      titleSpan="E PAGA"
      subtitle="scegli come ricevere l'ordine e come pagare: il pagamento è simulato"
    />

    ${error && html`<${FormMessage} message=${error} type="error" />`}

    <form class="payment-form" onSubmit=${handleConfirm}>
      <div class="panel-block">
        <${SectionHeading} eyebrow="modalità" title="RITIRO_" titleSpan="O CONSEGNA" />
        <div class="shortcut-row">
          <${ModeChoice} value="pickup" current=${mode} onSelect=${setMode} label="RITIRO IN SEDE" />
          <${ModeChoice} value="delivery" current=${mode} onSelect=${setMode} label=${`CONSEGNA (+€ ${ESTIMATED_DELIVERY_FEE.toFixed(2)})`} />
        </div>

        ${mode === 'delivery' && html`
          <div class="address-fields">
            ${addressFields(address, setAddress)}
          </div>
        `}
      </div>

      <div class="panel-block">
        <${SectionHeading} eyebrow="opzioni" title="COME_" titleSpan="PAGHI" subtitle="il pagamento è una simulazione: nessun addebito reale" />

        <div class="payment-options" role="radiogroup" aria-label="opzioni di pagamento">
          <${PaymentChoice}
            name="payment"
            value="cash"
            current=${choice}
            onSelect=${setChoice}
            label="pagamento alla cassa"
            detail="contanti al ritiro o alla consegna, nulla da salvare"
          />
          <${PaymentChoice}
            name="payment"
            value="paypal"
            current=${choice}
            onSelect=${setChoice}
            label="paypal"
            detail="simulato, nessun conto collegato"
          />
          <${PaymentChoice}
            name="payment"
            value="saved"
            current=${choice}
            onSelect=${setChoice}
            label="carta salvata"
            detail=${savedMethods.length ? 'scegli una delle tue carte' : 'nessuna carta salvata'}
          />

          ${choice === 'saved' && html`
            <${AsyncBoundary} loading=${false} error=${methodsError} label="carte salvate">
              <div class="saved-methods" role="radiogroup" aria-label="carte salvate">
                ${savedMethods.length === 0
                  ? html`<p class="muted payment-hint">Salva una carta dal profilo per ritrovarla qui.</p>`
                  : savedMethods.map(method => html`
                    <label class="payment-choice payment-choice-card" key=${entityId(method)}>
                      <input
                        type="radio"
                        name="savedMethod"
                        checked=${savedMethodId === entityId(method)}
                        onChange=${() => setSavedMethodId(entityId(method))}
                      />
                      <span>${method.label}</span>
                      <b class="tag tone-amber">${paymentMethodSummary(method)}</b>
                    </label>
                  `)}
              </div>
            <//>
          `}

          <${PaymentChoice}
            name="payment"
            value="new"
            current=${choice}
            onSelect=${setChoice}
            label="nuova carta"
            detail="viene salvata con le sole ultime quattro cifre"
          />

          ${choice === 'new' && html`
            <div class="new-card">
              <${CardFields}
                values=${newCard}
                errors=${cardErrors}
                onChange=${changes => setNewCard(current => ({ ...current, ...changes }))}
              />
            </div>
          `}
        </div>
      </div>

      <div class="panel-block">
        <${SectionHeading} eyebrow="riepilogo" title="CARRELLO" subtitle="il totale finale è calcolato dal server" />
        <ul class="order-queue">
          ${items.map((item, index) => html`
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
        <button class="terminal-button primary" type="submit" disabled=${busy}>
          ${busy ? '[ ... ] attendi' : '[ enter ] conferma e paga'}
        </button>
        <button class="terminal-button" type="button" onClick=${() => navigate('/orders')}>[ esc ] indietro</button>
      </div>
    </form>
  `;
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

function PaymentChoice({ name, value, current, onSelect, label, detail }) {
  const active = current === value;

  return html`
    <label class="payment-choice">
      <input
        type="radio"
        name=${name}
        checked=${active}
        onChange=${() => onSelect(value)}
      />
      <span class="payment-choice-label">${label}</span>
      <small class="muted">${detail}</small>
    </label>
  `;
}

function addressFields(address, setAddress) {
  const fields = [
    { name: 'street', label: 'via e numero', placeholder: 'Via Roma 1' },
    { name: 'city', label: 'città', placeholder: 'Milano' },
    { name: 'zip', label: 'cap', placeholder: '20100' },
    { name: 'notes', label: 'note (opzionale)', placeholder: 'Citofono, piano...' }
  ];

  return html`
    <div class="profile-grid">
      ${fields.map(field => html`
        <label class="profile-field" key=${field.name}>
          ${field.label}
          <input
            type="text"
            placeholder=${field.placeholder}
            value=${address[field.name]}
            onInput=${(event) => setAddress(current => ({ ...current, [field.name]: event.currentTarget.value }))}
          />
        </label>
      `)}
    </div>
  `;
}

export default OrderPaymentPage;
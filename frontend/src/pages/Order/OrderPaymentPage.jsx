/**
 * OrderPaymentPage - terzo e ultimo passo del wizard: si sceglie come ricevere
 * l'ordine e come pagare. Il pagamento è una simulazione (il progetto non
 * addebita nulla): i contanti restano un'opzione alla cassa senza essere
 * salvati, una carta salvata basta da sola, e una carta nuova viene prima
 * registrata (solo ultime quattro cifre) e poi usata per l'ordine. La conferma
 * passa da POST /cart/confirm, che è il server a calcolare i totali.
 */

import { useCallback, useEffect, useState } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { CustomerShell } from '../../components/Layout/CustomerShell.jsx';
import { SectionHeading } from '../../components/UI/SectionHeading.jsx';
import { FormMessage } from '../../components/UI/FormMessage.jsx';
import { AsyncBoundary } from '../../components/Console/AsyncBoundary.jsx';
import { WizardSteps } from '../../components/Order/WizardSteps.jsx';
import { Loading } from '../../components/UI/Loading.jsx';
import { paymentService } from '../../services/paymentService.js';
import { useOrderStore } from '../../state/orderStore.js';
import { navigate } from '../../router/navigate.js';
import { euro } from '../../domain/format.js';
import { entityId } from '../../domain/entity.js';
import { orderReference } from '../../domain/orders.js';
import { paymentMethodSummary } from '../../domain/payments.js';
import { useResource } from '../../hooks/useResource.js';
import { useAuthStore } from '../../state/authStore.js';
import { AuthRequiredModal } from '../../components/Auth/AuthRequiredModal.jsx';
import { PaymentMethodForm } from '../../components/PaymentMethods/PaymentMethodForm.jsx';
import '../../styles/address-suggestions.css';

/* tariffa solo indicativa: il totale definitivo arriva dal server alla conferma */
const ESTIMATED_DELIVERY_FEE = 3.5;

const EMPTY_ADDRESS = { street: '', city: '', province: '', zip: '', notes: '' };
export function OrderPaymentPage() {
  const order = useOrderStore();
  const { user, isAuthenticated } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mode, setMode] = useState('pickup');
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const savedAddress = normalizeAddress(user?.address);
  const hasSavedAddress = isCompleteAddress(savedAddress);
  const [addressSource, setAddressSource] = useState(hasSavedAddress ? 'saved' : 'new');
  const [phase, setPhase] = useState('delivery');
  const [choice, setChoice] = useState('cash');
  const [savedMethodId, setSavedMethodId] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
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

  useEffect(() => {
    if (hasSavedAddress) setAddress(savedAddress);
  }, [user]);

  if (!isAuthenticated) {
    return html`
      <${CustomerShell} title="ordina" subtitle="passo 3 · pagamento" wizardMode>
        <section class="terminal-screen">
          <${WizardSteps} current="payment" />
          <div class="queue-empty">
            <p><b>_</b> sessione richiesta</p>
            <p class="muted">Per procedere al pagamento devi essere autenticato.</p>
          </div>
        </section>
      </${CustomerShell}>
      <${AuthRequiredModal} onDismiss=${() => navigate('/orders')} />
    `;
  }

  const moveTo = (nextPhase) => {
    setError('');
    if (nextPhase !== 'delivery' && mode === 'delivery' && !addressComplete) {
      setError('Completa via, città e CAP per la consegna a domicilio.');
      setPhase('delivery');
      return;
    }
    if (nextPhase === 'summary' && choice === 'saved' && !savedMethodId) {
      setError('Scegli quale carta salvata usare.');
      setPhase('payment');
      return;
    }
    setPhase(nextPhase);
  };

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

    setBusy(true);
    try {
      const delivery = mode === 'delivery'
        ? { address: formatAddress(address) }
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
      <${CustomerShell} title="ordina" subtitle="ordine confermato" wizardMode>
        <section class="terminal-screen">
          <${WizardSteps} current="payment" />
          <div class="queue-empty order-success">
            <p><b>✓</b> ordine confermato.</p>
            <h2 class="order-code-large">${orderReference(done)}</h2>
          </div>
          <div class="shortcut-row mt-lg">
            <button class="terminal-button primary" type="button" onClick=${() => navigate(`/orders/${entityId(done)}`)}>[ enter ] segui l'ordine</button>
            <button class="terminal-button" type="button" onClick=${() => navigate('/profile')}>[ esc ] profilo</button>
          </div>
        </section>
      <//>
    `;
  }

  const displayLoading = (order.loading || methods.loading) && items.length === 0 && !subtotal;

  return html`
    <${CustomerShell} title="ordina" subtitle="passo 3 · pagamento" wizardMode>
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
                address, setAddress, savedAddress, hasSavedAddress,
                addressSource, setAddressSource,
                choice, setChoice,
                savedMethodId, setSavedMethodId,
                savedMethods, methodsError: methods.error, reloadMethods: methods.reload,
                showPaymentForm, setShowPaymentForm,
                error, busy,
                items, subtotal, estimatedTotal,
                addressComplete,
                phase, moveTo, handleConfirm
              })
        }
      </section>
    <//>
  `;
}

function renderPayment(props) {
  const {
    items, subtotal, estimatedTotal, mode, error, busy, choice, phase,
    savedMethods, methodsError, reloadMethods,
    address, setAddress, setMode, setChoice,
    savedAddress, hasSavedAddress, addressSource, setAddressSource,
    savedMethodId, setSavedMethodId,
    showPaymentForm, setShowPaymentForm,
    moveTo, handleConfirm
  } = props;

  return html`
    <div class="checkpoint-center">
    ${error && html`<${FormMessage} message=${error} type="error" />`}

    <form class="payment-form" onSubmit=${handleConfirm}>
      <div class="checkout-stage" key=${phase}>
        ${phase === 'delivery' && renderDelivery(address, setAddress, mode, setMode, moveTo, savedAddress, hasSavedAddress, addressSource, setAddressSource)}
        ${phase === 'payment' && renderPaymentChoice({
          choice, setChoice, savedMethods, methodsError, savedMethodId,
          setSavedMethodId, showPaymentForm, setShowPaymentForm, reloadMethods, moveTo
        })}
        ${phase === 'summary' && renderSummary({
          items, subtotal, estimatedTotal, mode, address, choice, savedMethods,
          savedMethodId, moveTo, busy
        })}
      </div>
    </form>
    </div>
  `;
}

function renderDelivery(address, setAddress, mode, setMode, moveTo, savedAddress, hasSavedAddress, addressSource, setAddressSource) {
  return html`
    <section class="panel-block">
      <div class="delivery-intro">
        <p class="eyebrow">01 / destinazione</p>
        <h2>DOVE ARRIVA<span class="heading-accent">?</span></h2>
        <p>Scegli come vuoi ricevere il tuo ordine. L'indirizzo resta qui mentre completi il pagamento.</p>
      </div>
      <div class="delivery-modes" role="radiogroup" aria-label="modalità di ricezione">
        <${ModeChoice}
          value="pickup"
          current=${mode}
          onSelect=${setMode}
          label="RITIRO IN SEDE"
          detail="passa tu a prenderlo"
          marker="01"
        />
        <${ModeChoice}
          value="delivery"
          current=${mode}
          onSelect=${setMode}
          label="CONSEGNA A DOMICILIO"
          detail=${`+€ ${ESTIMATED_DELIVERY_FEE.toFixed(2)} · direttamente da te`}
          marker="02"
        />
      </div>
      ${mode === 'delivery' && html`
        <${AddressFields}
          address=${address}
          setAddress=${setAddress}
          savedAddress=${savedAddress}
          hasSavedAddress=${hasSavedAddress}
          addressSource=${addressSource}
          setAddressSource=${setAddressSource}
        />
      `}
      <div class="shortcut-row stage-actions">
        <button class="terminal-button primary" type="button" onClick=${() => moveTo('payment')}>[ enter ] continua al pagamento</button>
      </div>
    </section>
  `;
}

function renderPaymentChoice({ choice, setChoice, savedMethods, methodsError, savedMethodId, setSavedMethodId, showPaymentForm, setShowPaymentForm, reloadMethods, moveTo }) {
  return html`
    <section class="panel-block">
      <${SectionHeading} eyebrow="02 / pagamento" title="COME_" titleSpan="PAGHI" subtitle="pagamento simulato: nessun addebito reale" />
      <div class="payment-options" role="radiogroup" aria-label="opzioni di pagamento">
        <${PaymentChoice} name="payment" value="cash" current=${choice} onSelect=${setChoice} label="pagamento in negozio" detail="paghi alla cassa al momento del ritiro o della consegna" />
        <${PaymentChoice} name="payment" value="saved" current=${choice} onSelect=${setChoice} label="carta salvata" detail=${savedMethods.length ? 'scegli una delle tue carte' : 'nessuna carta salvata'} />
        ${choice === 'saved' && html`
          <${AsyncBoundary} loading=${false} error=${methodsError} label="carte salvate">
            <div class="saved-methods" role="radiogroup" aria-label="carte salvate">
              ${savedMethods.length === 0 ? html`<p class="muted payment-hint">Aggiungi una carta qui sotto per usarla al prossimo ordine.</p>` : savedMethods.map(method => html`
                <label class="payment-choice payment-choice-card" key=${entityId(method)}>
                  <input type="radio" name="savedMethod" checked=${savedMethodId === entityId(method)} onChange=${() => setSavedMethodId(entityId(method))} />
                  <span>${method.label}</span>
                  <b class="tag tone-amber">${paymentMethodSummary(method)}</b>
                </label>
              `)}
            </div>
          <//>
        `}
        <button class="terminal-button" type="button" onClick=${() => setShowPaymentForm(true)}>[ + ] aggiungi metodo</button>
      </div>
      <div class="shortcut-row stage-actions">
        <button class="terminal-button" type="button" onClick=${() => moveTo('delivery')}>[ ← ] consegna</button>
        <button class="terminal-button primary" type="button" onClick=${() => moveTo('summary')}>[ enter ] continua al riepilogo</button>
      </div>
    </section>
    ${showPaymentForm && html`<${PaymentMethodModal} onClose=${() => setShowPaymentForm(false)} onSaved=${async () => { await reloadMethods(); setShowPaymentForm(false); }} />`}
  `;
}

function renderSummary({ items, subtotal, estimatedTotal, mode, address, choice, savedMethods, savedMethodId, moveTo, busy }) {
  const selected = savedMethods.find(method => entityId(method) === savedMethodId);
  return html`
    <section class="panel-block">
      <${SectionHeading} eyebrow="03 / riepilogo" title="TUTTO_" titleSpan="PRONTO" subtitle="controlla l'ordine prima di inviarlo alla cucina" />
      <div class="checkout-review">
        <p><span>consegna</span><b>${mode === 'delivery' ? formatAddress(address) : 'ritiro in sede'}</b></p>
        <p><span>pagamento</span><b>${choice === 'cash' ? 'in negozio' : selected?.label || paymentMethodSummary(selected) || 'carta salvata'}</b></p>
      </div>
      <ul class="order-queue">
        ${items.map((item, index) => html`
          <li class="order-item" key=${item.dishId || index}>
            <header class="order-head"><b class="order-code">${item.name || 'piatto'}</b><span class="tag tone-amber">${item.quantity}×</span></header>
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
      <div class="shortcut-row stage-actions">
        <button class="terminal-button" type="button" onClick=${() => moveTo('payment')}>[ ← ] pagamento</button>
        <button class="terminal-button primary" type="submit" disabled=${busy}>${busy ? '[ ... ] invio' : '[ enter ] conferma ordine'}</button>
      </div>
    </section>
  `;
}

function ModeChoice({ value, current, onSelect, label, detail, marker }) {
  const active = current === value;
  return html`
    <button class=${`delivery-mode ${active ? 'active' : ''}`} type="button" role="radio" aria-checked=${active} onClick=${() => onSelect(value)}>
      <span class="delivery-mode-marker">${marker}</span>
      <span class="delivery-mode-copy">
        <strong>${label}</strong>
        <small>${detail}</small>
      </span>
      <span class="delivery-mode-state" aria-hidden="true">${active ? '●' : '○'}</span>
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

function AddressFields({ address, setAddress, savedAddress, hasSavedAddress, addressSource, setAddressSource }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = address.street.trim();
    if (query.length < 3) {
      setSuggestions([]);
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&addressdetails=1&limit=5`, { signal: controller.signal });
        if (!response.ok) throw new Error('impossibile cercare l’indirizzo');
        setSuggestions(await response.json());
      } catch (error) {
        if (error.name !== 'AbortError') setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [address.street]);

  const selectSuggestion = suggestion => {
    const details = suggestion.address || {};
    setAddress(current => ({
      ...current,
      street: [details.road, details.house_number].filter(Boolean).join(' ') || suggestion.display_name,
      city: details.city || details.town || details.village || current.city,
      province: details.state || details.county || current.province,
      zip: details.postcode || current.zip
    }));
    setSuggestions([]);
  };

  return html`
    <fieldset class="address-fields">
      <legend>indirizzo di consegna</legend>
      <p class="address-helper">Scegli un recapito già salvato oppure inseriscine uno nuovo.</p>
      <div class="address-source-switch" role="tablist" aria-label="origine dell'indirizzo">
        ${hasSavedAddress && html`
          <button
            class=${`address-source-choice ${addressSource === 'saved' ? 'active' : ''}`}
            type="button"
            role="tab"
            aria-selected=${addressSource === 'saved'}
            onClick=${() => { setAddressSource('saved'); setAddress(savedAddress); }}
          >
            <span>indirizzo salvato</span>
            <small>${formatAddress(savedAddress)}</small>
          </button>
        `}
        <button
          class=${`address-source-choice ${addressSource === 'new' ? 'active' : ''}`}
          type="button"
          role="tab"
          aria-selected=${addressSource === 'new'}
          onClick=${() => { setAddressSource('new'); setAddress(EMPTY_ADDRESS); }}
        >
          <span>aggiungi nuovo indirizzo</span>
          <small>compila i dati di consegna</small>
        </button>
      </div>
      ${addressSource === 'new' && html`<div class="profile-grid">
        <label class="profile-field address-field-wrapper">
          via e numero
          <input type="text" autocomplete="street-address" placeholder="Via Roma 1" value=${address.street} onInput=${event => setAddress(current => ({ ...current, street: event.currentTarget.value }))} />
          ${loading && html`<small class="address-search-status">cerco indirizzi...</small>`}
          ${suggestions.length > 0 && html`<ul class="address-suggestions" role="listbox">${suggestions.map((suggestion, index) => html`<li key=${index} role="option" tabIndex="0" onClick=${() => selectSuggestion(suggestion)} onKeyDown=${event => event.key === 'Enter' && selectSuggestion(suggestion)}>${suggestion.display_name}</li>`)}</ul>`}
        </label>
        ${[['city', 'città', 'Milano', 'address-level2'], ['province', 'provincia', 'Milano', 'address-level1'], ['zip', 'CAP', '20100', 'postal-code'], ['notes', 'note (opzionale)', 'Citofono, piano...', undefined]].map(([name, label, placeholder, autocomplete]) => html`
          <label class="profile-field" key=${name}>${label}<input type="text" autocomplete=${autocomplete} placeholder=${placeholder} value=${address[name]} onInput=${event => setAddress(current => ({ ...current, [name]: event.currentTarget.value }))} /></label>
        `)}
      </div>`}
    </fieldset>
  `;
}

function PaymentMethodModal({ onClose, onSaved }) {
  const [busy, setBusy] = useState(false);
  const submit = async payload => {
    setBusy(true);
    const result = await paymentService.create(payload);
    setBusy(false);
    if (!result?.success) return false;
    onSaved();
    return true;
  };
  return html`
    <div class="checkout-modal-backdrop" role="presentation" onClick=${event => event.target === event.currentTarget && onClose()}>
      <section class="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="payment-dialog-title">
        <div class="modal-heading"><h2 id="payment-dialog-title">AGGIUNGI METODO_</h2><button class="terminal-button" type="button" onClick=${onClose}>[ x ] chiudi</button></div>
        <${PaymentMethodForm} busy=${busy} onSubmit=${submit} />
      </section>
    </div>
  `;
}

function formatAddress(address) {
  return [address.street, address.city, address.province, address.zip].filter(Boolean).join(', ');
}

function normalizeAddress(address) {
  return { ...EMPTY_ADDRESS, ...(address || {}) };
}

function isCompleteAddress(address) {
  return Boolean(address.street.trim() && address.city.trim() && address.zip.trim());
}

export default OrderPaymentPage;
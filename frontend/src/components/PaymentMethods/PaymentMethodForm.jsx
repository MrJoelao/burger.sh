/**
 * PaymentMethodForm - salva un metodo di pagamento. Le opzioni proposte sono
 * carta, paypal e altro, ma solo la carta arriva davvero al backend: le altre
 * restano scelte di facciata e vengono spiegate. La carta chiede i dati
 * completi (intestatario, numero, scadenza, cvv) ma il form invia solo le
 * ultime quattro cifre, come il backend chiede.
 */

import { useState } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { TerminalButton } from '../../components/Auth/TerminalButton.jsx';
import { ProfileField } from '../../pages/Profile/components/ProfileField.jsx';
import { CardFields } from './CardFields.jsx';
import {
  SAVED_PAYMENT_TYPES,
  cardFormErrors,
  cardMethodPayload
} from '../../domain/payments.js';

const EMPTY_CARD = { name: '', surname: '', number: '', expiry: '', cvv: '' };

export function PaymentMethodForm({ busy = false, onSubmit }) {
  const [type, setType] = useState('card');
  const [card, setCard] = useState(EMPTY_CARD);
  const [isDefault, setIsDefault] = useState(false);
  const [errors, setErrors] = useState({});

  const isCard = type === 'card';

  const submit = async (event) => {
    event.preventDefault();
    if (!isCard) return;

    const found = cardFormErrors(card);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const done = await onSubmit(cardMethodPayload({ ...card, isDefault }));
    if (done) {
      setCard(EMPTY_CARD);
      setIsDefault(false);
      setErrors({});
    }
  };

  return html`
    <form class="profile-form" onSubmit=${submit}>
      <div class="profile-grid">
        <${ProfileField} label="tipo">
          <select
            value=${type}
            onChange=${(event) => setType(event.currentTarget.value)}
          >
            ${SAVED_PAYMENT_TYPES.map(option => html`
              <option key=${option.id} value=${option.id}>${option.label}</option>
            `)}
          </select>
        <//>
      </div>

      ${isCard
        ? html`
          <${CardFields} values=${card} errors=${errors} onChange=${changes => setCard(current => ({ ...current, ...changes }))} />

          <label class="profile-preference">
            <input
              type="checkbox"
              checked=${isDefault}
              onInput=${(event) => setIsDefault(event.currentTarget.checked)}
            />
            predefinito
          </label>
        `
        : html`
          <div class="alert alert-info" role="status">
            In questa versione salviamo solo le carte: <b>${SAVED_PAYMENT_TYPES.find(option => option.id === type)?.label}</b> si sceglie al momento del pagamento.
          </div>
        `}

      <${TerminalButton} primary type="submit" disabled=${busy || !isCard}>
        [ enter ] aggiungi metodo
      <//>
    </form>
  `;
}

export default PaymentMethodForm;
/**
 * PaymentMethodForm - aggiunge o modifica un metodo di pagamento. Il tipo si
 * sceglie solo alla creazione (il backend non lo lascia cambiare): in modifica
 * il select resta visibile ma bloccato. Le cifre della carta sono solo le
 * ultime quattro e non vengono mai inviate da sole.
 */

import { useState } from 'preact/hooks';
import { html } from '../../../utils/htm.js';
import { TerminalButton } from '../../../components/Auth/TerminalButton.jsx';
import { ProfileField } from '../../Profile/components/ProfileField.jsx';
import {
  paymentMethodErrors,
  paymentMethodPayload,
  paymentMethodUpdatePayload,
  paymentTypeLabels
} from '../../../domain/payments.js';

const EMPTY_FORM = { type: 'card', label: '', details: '', isDefault: false };

function initialForm(method) {
  if (!method) return EMPTY_FORM;
  return {
    type: method.type,
    label: method.label || '',
    details: method.details || '',
    isDefault: Boolean(method.isDefault)
  };
}

export function PaymentMethodForm({ method = null, busy = false, onSubmit }) {
  const [form, setForm] = useState(() => initialForm(method));
  const [errors, setErrors] = useState({});

  const isEditing = Boolean(method);
  const isCard = form.type === 'card';

  const update = (changes) => setForm(current => ({ ...current, ...changes }));

  const submit = async (event) => {
    event.preventDefault();

    const found = paymentMethodErrors(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const payload = isEditing ? paymentMethodUpdatePayload(form) : paymentMethodPayload(form);
    const done = await onSubmit(payload);
    if (done && !isEditing) setForm(EMPTY_FORM);
  };

  return html`
    <form class="profile-form" onSubmit=${submit}>
      <div class="profile-grid">
        <${ProfileField} label="tipo" error=${errors.type}>
          <select
            value=${form.type}
            disabled=${isEditing}
            onInput=${(event) => update({ type: event.currentTarget.value })}
          >
            ${Object.entries(paymentTypeLabels).map(([value, label]) => html`
              <option key=${value} value=${value}>${label}</option>
            `)}
          </select>
        <//>

        <${ProfileField} label="etichetta" error=${errors.label}>
          <input
            type="text"
            placeholder="Carta principale"
            value=${form.label}
            onInput=${(event) => update({ label: event.currentTarget.value })}
          />
        <//>

        ${isCard && html`
          <${ProfileField} label="ultime 4 cifre" error=${errors.details} hint="il numero completo non viene mai inviato">
            <input
              type="text"
              inputMode="numeric"
              maxLength="4"
              placeholder="1234"
              value=${form.details}
              onInput=${(event) => update({ details: event.currentTarget.value })}
            />
          <//>
        `}
      </div>

      <label class="profile-preference">
        <input
          type="checkbox"
          checked=${form.isDefault}
          onInput=${(event) => update({ isDefault: event.currentTarget.checked })}
        />
        predefinito
      </label>

      <${TerminalButton} primary type="submit" disabled=${busy}>
        ${isEditing ? '[ enter ] salva modifiche' : '[ enter ] aggiungi metodo'}
      <//>
    </form>
  `;
}

export default PaymentMethodForm;

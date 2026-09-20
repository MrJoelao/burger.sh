/**
 * CardFields - i campi di una carta di credito. Usato sia dal salvataggio nel
 * profilo sia dalla schermata di pagamento: i descrittori vengono dal dominio
 * (CARD_FIELDS), così UI e validazione restano la stessa verità.
 */

import { html } from '../../utils/htm.js';
import { CARD_FIELDS } from '../../domain/payments.js';
import { ProfileField } from '../../pages/Profile/components/ProfileField.jsx';

export function CardFields({ values = {}, errors = {}, onChange = () => {} }) {
  return html`
    <div class="profile-grid">
      ${CARD_FIELDS.map(field => html`
        <${ProfileField} key=${field.name} label=${field.label} error=${errors[field.name] || ''}>
          <input
            type="text"
            inputmode=${field.inputMode || 'text'}
            maxLength=${field.maxLength}
            placeholder=${field.placeholder}
            value=${values[field.name] || ''}
            onInput=${(event) => onChange({ [field.name]: event.currentTarget.value })}
          />
        <//>
      `)}
    </div>
  `;
}

export default CardFields;
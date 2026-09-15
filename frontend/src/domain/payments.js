/**
 * regole pure dei metodi di pagamento del cliente. il progetto non addebita
 * nulla: il metodo si salva e basta, il pagamento resta una simulazione. il
 * backend accetta per una carta solo le ultime quattro cifre, mai il numero
 * completo (openapi.yaml, CreatePaymentMethodRequest): la validazione qui
 * impedisce di inviare altro.
 */

export const paymentTypeLabels = { card: 'carta', cash: 'contanti' };

export const CARD_DIGITS = /^\d{4}$/;

export const MIN_LABEL_LENGTH = 2;

function labelError(label) {
  return String(label).trim().length < MIN_LABEL_LENGTH
    ? `etichetta di almeno ${MIN_LABEL_LENGTH} caratteri`
    : '';
}

/* per una carta servono le ultime quattro cifre, per i contanti sono vietate */
function detailsError(type, details) {
  const value = String(details).trim();

  if (type === 'card') {
    return CARD_DIGITS.test(value) ? '' : 'servono le ultime 4 cifre';
  }

  return value ? 'i contanti non hanno cifre' : '';
}

/* errori per campo, vuoto quando il metodo è accettabile così com'è */
export function paymentMethodErrors({ type = 'card', label = '', details = '' } = {}) {
  const errors = {};

  if (!Object.hasOwn(paymentTypeLabels, type)) {
    errors.type = 'tipo non valido';
    return errors;
  }

  const labelMessage = labelError(label);
  if (labelMessage) errors.label = labelMessage;

  const detailsMessage = detailsError(type, details);
  if (detailsMessage) errors.details = detailsMessage;

  return errors;
}

export function paymentMethodSummary(method) {
  if (!method) return '';
  if (method.type === 'cash') return paymentTypeLabels.cash;
  return method.details ? `•••• ${method.details}` : paymentTypeLabels.card;
}

export function paymentMethodPayload({ type, label, details, isDefault = false }) {
  const payload = { type, label: String(label).trim(), isDefault: Boolean(isDefault) };
  if (type === 'card') payload.details = String(details).trim();
  return payload;
}

/* il tipo non è modificabile dopo la creazione: la modifica invia solo il
   resto (openapi.yaml, UpdatePaymentMethodRequest) */
export function paymentMethodUpdatePayload({ type, label, details, isDefault = false }) {
  const payload = { label: String(label).trim(), isDefault: Boolean(isDefault) };
  if (type === 'card') payload.details = String(details).trim();
  return payload;
}

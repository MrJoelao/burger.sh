/**
 * regole pure dei metodi di pagamento del cliente. il progetto non addebita
 * nulla: il metodo si salva e basta, il pagamento resta una simulazione. il
 * backend memorizza per una carta solo le ultime quattro cifre, mai il numero
 * completo (openapi.yaml, CreatePaymentMethodRequest): il form chiede i dati
 * completi per esperienza e validazione, ma qui si tiene solo il minimo.
 */

/* opzioni del form di salvataggio: i contanti non si salvano (non c'è nulla da
   salvare), paypal e altro restano opzioni ma solo la carta arriva al backend */
export const SAVED_PAYMENT_TYPES = [
  { id: 'card', label: 'carta' },
  { id: 'paypal', label: 'paypal' },
  { id: 'other', label: 'altro' }
];

/* etichette di visualizzazione: i contanti possono esistere come dati legacy
   dal backend, ma non si creano più dal form */
export const paymentTypeLabels = {
  card: 'carta',
  cash: 'contanti',
  paypal: 'paypal',
  other: 'altro'
};

/* descrittori dei campi di una carta: condivisi da form di salvataggio e
   schermata di pagamento, così la validazione e la UI non divergono */
export const CARD_FIELDS = [
  { name: 'name', label: 'nome intestatario', placeholder: 'Mario', maxLength: 40 },
  { name: 'surname', label: 'cognome intestatario', placeholder: 'Rossi', maxLength: 40 },
  { name: 'number', label: 'numero carta', placeholder: '4242 4242 4242 4242', inputMode: 'numeric', maxLength: 19 },
  { name: 'expiry', label: 'scadenza', placeholder: 'MM/AA', inputMode: 'numeric', maxLength: 5 },
  { name: 'cvv', label: 'cvv', placeholder: '123', inputMode: 'numeric', maxLength: 4 }
];

const NAME_MIN_LENGTH = 2;
const MIN_CARD_DIGITS = 13;
const EXPIRY_FORMAT = /^\d{2}\/\d{2}$/;
const CVV_FORMAT = /^\d{3,4}$/;

function holderError(value) {
  return String(value).trim().length < NAME_MIN_LENGTH
    ? `almeno ${NAME_MIN_LENGTH} caratteri`
    : '';
}

function numberError(number) {
  const digits = String(number).replace(/\D/g, '');
  return digits.length >= MIN_CARD_DIGITS ? '' : 'numero carta non valido';
}

function expiryError(expiry) {
  const value = String(expiry).trim();

  if (!EXPIRY_FORMAT.test(value)) return 'formato MM/AA';

  const [month, year] = value.split('/').map(Number);
  if (month < 1 || month > 12) return 'mese non valido';

  /* MM/AA con anno a due cifre: 12/29 = fine dicembre 2029 */
  const lastValidDay = new Date(2000 + year, month, 0, 23, 59, 59);
  return lastValidDay < new Date() ? 'carta scaduta' : '';
}

function cvvError(cvv) {
  return CVV_FORMAT.test(String(cvv)) ? '' : '3 o 4 cifre';
}

/* errori per campo, vuoto quando la carta è accettabile così com'è */
export function cardFormErrors({ name = '', surname = '', number = '', expiry = '', cvv = '' } = {}) {
  const errors = {};

  const nameMessage = holderError(name);
  if (nameMessage) errors.name = nameMessage;

  const surnameMessage = holderError(surname);
  if (surnameMessage) errors.surname = surnameMessage;

  const numberMessage = numberError(number);
  if (numberMessage) errors.number = numberMessage;

  const expiryMessage = expiryError(expiry);
  if (expiryMessage) errors.expiry = expiryMessage;

  const cvvMessage = cvvError(cvv);
  if (cvvMessage) errors.cvv = cvvMessage;

  return errors;
}

/* dal numero completo si conservano solo le ultime quattro cifre */
export function cardDetailsFrom(number) {
  return String(number).replace(/\D/g, '').slice(-4);
}

/* payload accettato dal backend: tipo carta, etichetta derivata, ultime quattro
   cifre. il numero completo non esce mai dal browser. */
export function cardMethodPayload({ name = '', surname = '', number = '', isDefault = false } = {}) {
  const holder = `${name.trim()} ${surname.trim()}`.replace(/\s+/g, ' ').trim();

  return {
    type: 'card',
    label: `Carta di ${holder}`,
    details: cardDetailsFrom(number),
    isDefault: Boolean(isDefault)
  };
}

export function paymentMethodSummary(method) {
  if (!method) return '';
  if (method.type === 'card') return method.details ? `•••• ${method.details}` : paymentTypeLabels.card;
  return paymentTypeLabels[method.type] || method.type || '';
}
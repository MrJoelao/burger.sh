/**
 * Feedback - esito di un salvataggio, condiviso dai pannelli: messaggio di
 * successo o di errore sotto il form, con il tono usato per il colore.
 */

import { html } from '../../../utils/htm.js';

export function feedbackFrom(result, successText, fallback) {
  return result?.success
    ? { tone: 'ok', text: successText }
    : { tone: 'error', text: result?.message || fallback };
}

export function Feedback({ feedback }) {
  if (!feedback) return null;

  return html`<p class=${`profile-feedback ${feedback.tone}`} role="status">${feedback.text}</p>`;
}

export default Feedback;

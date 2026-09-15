/**
 * FullScreenError - Full-screen error page component
 * Simple version for debugging
 */

import { html } from '../../utils/htm.js';
import { navigate } from '../../router/navigate.js';

export function FullScreenError({
  statusCode = 404,
  title = 'NOT FOUND',
  subtitle = 'address not found',
  message = 'Questo percorso non esiste nella directory del sistema.',
  primaryLabel = 'torna alla home',
  primaryAction = () => navigate('/'),
  secondaryLabel = 'torna indietro',
  secondaryAction = () => window.history.back()
}) {
  return html`
    <div class="error-fullscreen">
      <div class="error-content">
        <p class="error-eyebrow">${subtitle}</p>
        <h1 class="error-title">
          <span class="error-code">${statusCode}_</span>
          <span class="error-title-highlight">${title}</span>
        </h1>
        <p class="error-message">${message}</p>
        <div class="error-actions">
          <button class="terminal-button primary error-btn-primary" onClick=${primaryAction}>
            <span>[ enter ]</span>
            <span>${primaryLabel}</span>
            <b>→</b>
          </button>
          ${secondaryAction ? html`
            <button class="terminal-button error-btn-secondary" onClick=${secondaryAction}>
              <span>[ esc ]</span>
              <span>${secondaryLabel}</span>
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

export default FullScreenError;

import { html } from '../../utils/htm.js';
import { useEffect, useState } from 'preact/hooks';
import { navigate } from '../../router/navigate.js';

export function FullScreenError({
  statusCode = 404,
  title = 'NOT FOUND',
  subtitle = 'address not found',
  message = 'Questo percorso non esiste nella directory del sistema.',
  primaryLabel = 'torna alla home',
  primaryAction = () => navigate('/'),
  secondaryLabel = 'torna indietro',
  secondaryAction = () => window.history.back(),
  easterEggLabel = 'digita burger sulla tastiera per aprire il canale segreto'
}) {
  const [secretOpen, setSecretOpen] = useState(false);

  useEffect(() => {
    let buffer = '';
    const onKeyDown = (event) => {
      if (event.key.length !== 1) return;
      buffer = `${buffer}${event.key.toLowerCase()}`.slice(-6);
      if (buffer === 'burger') setSecretOpen(true);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return html`
    <main class="error-fullscreen" aria-labelledby="error-title">
      <div class="error-noise" aria-hidden="true"></div>
      <div class="error-shell">
        <header class="error-header">
          <a class="error-wordmark" href="/" onClick=${(event) => {
            event.preventDefault();
            navigate('/');
          }}>burger<span>.sh</span></a>
          <span class="error-live"><i></i> system signal lost</span>
        </header>

        <section class="error-content">
          <div class="error-code-block" aria-hidden="true">
            <span>HTTP</span>
            <strong>${statusCode}</strong>
            <span>NO ROUTE</span>
          </div>
          <p class="error-eyebrow">${subtitle}</p>
          <h1 class="error-title" id="error-title">
            ${title}<span>_</span>
          </h1>
          <p class="error-message">${message}</p>
          <div class="error-actions">
            <button class="terminal-button primary" type="button" onClick=${primaryAction}>
              [ enter ] ${primaryLabel} <b>→</b>
            </button>
            ${secondaryAction && html`
              <button class="terminal-button" type="button" onClick=${secondaryAction}>
                [ esc ] ${secondaryLabel}
              </button>
            `}
          </div>
          ${secretOpen && html`
            <p class="error-secret" role="status">BURGER CHANNEL OPEN // hai trovato il passaggio segreto.</p>
          `}
          <p class="error-hint">${secretOpen ? 'segnale ripristinato. puoi rientrare.' : easterEggLabel}</p>
        </section>

        <footer class="error-footer">
          <span>burger.sh / emergency console</span>
          <span>trace ${statusCode}-${String(statusCode * 17).padStart(3, '0')}</span>
        </footer>
      </div>
    </main>
  `;
}

export default FullScreenError;

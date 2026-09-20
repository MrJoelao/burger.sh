import { html } from '../../utils/htm.js';
import { useEffect, useState } from 'preact/hooks';
import { navigate } from '../../router/navigate.js';
import { TitleBar } from '../../components/Layout/TitleBar.jsx';

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
  const errorKind = statusCode === 401 ? 'auth' : statusCode === 403 ? 'denied' : 'not-found';
  const statusLabel = statusCode === 401 ? 'identity required' : statusCode === 403 ? 'access denied' : 'route missing';

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
    <main class="error-fullscreen" data-error-kind=${errorKind} aria-labelledby="error-title">
      <div class="crt-noise" aria-hidden="true"></div>
      <div class="error-shell">
        <${TitleBar}
          section="system"
          context=${statusLabel}
          status="grill online"
          links=${[]}
          current=${window.location.pathname}
          showClock
        />

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

        <footer class="footer-status">
          <span><b>enter</b> ${statusCode === 401 ? 'accedi' : 'torna alla home'}</span>
          <span><b>esc</b> indietro</span>
          <span>http ${statusCode}</span>
          <span class="live-command">guest@burger:~$ <i></i></span>
        </footer>
      </div>
    </main>
  `;
}

export default FullScreenError;

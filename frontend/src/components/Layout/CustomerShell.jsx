/**
 * CustomerShell - cornice dell'area cliente. Niente directory laterale: le
 * uniche opzioni stanno nella barra in alto (dashboard, ordini e profilo),
 * così il flusso resta guidato e non si ripete la stessa navigazione due volte.
 * Il brand riporta sempre alla home.
 */

import { html } from '../../utils/htm.js';
import { TitleBar } from './TitleBar.jsx';
import { useAuthStore } from '../../state/authStore.js';

const links = [
    { label: 'dashboard', path: '/dashboard' },
  { label: 'ordini', path: '/orders' },
  { label: 'profilo', path: '/profile' }
];

export function CustomerShell({ children, title = 'customer-ops', subtitle = 'account personale', wizardMode = false }) {
  const { user } = useAuthStore();
  const fullName = [user?.name, user?.surname].filter(Boolean).join(' ') || 'cliente';

  return html`
    <div class="crt-noise" aria-hidden="true"></div>
    <main class="console customer-console" aria-label="Customer console">
      <${TitleBar} section=${title} context=${subtitle} status="customer online" links=${links} brandPath="/" showClock=${false} />

      ${!wizardMode && html`
        <section class="identity-strip">
          <div class="brand-block"><span class="prompt">guest@burger:~$</span><h1>BURGER<br /><em>.SH</em></h1></div>
          <div class="system-copy"><p class="eyebrow">customer area / ordini e profilo</p><p>Ordina dalle filiali della catena e segui i tuoi acquisti.</p></div>
          <div class="shift-stamp"><span>CLIENTE</span><b>${fullName}</b><small>customer / verified</small></div>
        </section>
      `}

      <section class="customer-screen">${children}</section>

      <footer class="footer-status"><span><b>F1</b> help</span><span><b>esc</b> back</span><span class="live-command">guest@burger:~$ <i></i></span></footer>
    </main>
  `;
}

export default CustomerShell;
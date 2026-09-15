/**
 * CustomerShell - cornice dell'area cliente. Come le console di lavoro, la
 * directory laterale porta le sezioni del ruolo; il profilo resta solo nella
 * barra in alto. Un cliente non ha una filiale da amministrare, quindi la
 * directory elenca ordini, pagamenti e l'accesso alla composizione dell'ordine.
 */

import { html } from '../../utils/htm.js';
import { TitleBar } from './TitleBar.jsx';
import { useAuthStore } from '../../state/authStore.js';
import { navigate } from '../../router/navigate.js';

const links = [
  { label: 'dashboard', path: '/dashboard' },
  { label: 'ordini', path: '/orders' },
  { label: 'pagamenti', path: '/payment-methods' },
  { label: 'ordina', path: '/menu' },
  { label: 'profilo', path: '/profile' }
];

/* le sezioni operative stanno nella directory laterale, il profilo resta solo
   nella barra in alto */
const directoryLinks = links.slice(0, 4);

export function CustomerShell({ children, title = 'customer-ops', subtitle = 'account personale' }) {
  const { user } = useAuthStore();
  const currentPath = window.location.pathname;
  const fullName = [user?.name, user?.surname].filter(Boolean).join(' ') || 'cliente';

  return html`
    <div class="crt-noise" aria-hidden="true"></div>
    <main class="console management-shell" aria-label="Customer console">
      <${TitleBar} section=${title} context=${subtitle} status="customer online" links=${links} showClock=${false} />

      <section class="identity-strip">
        <div class="brand-block"><span class="prompt">guest@burger:~$</span><h1>BURGER<br /><em>.SH</em></h1></div>
        <div class="system-copy"><p class="eyebrow">customer area / 03</p><p>Segui i tuoi ordini, i pagamenti salvati e i tuoi dati.</p></div>
        <div class="shift-stamp"><span>CLIENTE</span><b>${fullName}</b><small>customer / verified</small></div>
      </section>

      <div class="management-grid">
        <nav class="command-list" aria-label="Customer directory">
          <p class="eyebrow">directory</p>
          ${directoryLinks.map((link, index) => html`<button class=${`nav-command ${link.path === currentPath ? 'active' : ''}`} type="button" onClick=${() => navigate(link.path)}><kbd>0${index + 1}</kbd> ${link.label}</button>`)}
          <div class="nav-footer"><span>tty / customer</span><span>scope / account</span><span>user / ${user?.name || 'cliente'}</span></div>
        </nav>
        <section class="workspace"><div>${children}</div></section>
      </div>

      <footer class="footer-status"><span><b>F1</b> help</span><span><b>esc</b> back</span><span class="live-command">guest@burger:~$ <i></i></span></footer>
    </main>
  `;
}

export default CustomerShell;

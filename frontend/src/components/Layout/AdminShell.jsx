import { html } from '../../utils/htm.js';
import { TitleBar } from './TitleBar.jsx';
import { useAuthStore } from '../../state/authStore.js';
import { navigate } from '../../router/navigate.js';

const links = [
  { label: 'dashboard', path: '/dashboard/admin' },
  { label: 'utenti', path: '/admin/users' },
  { label: 'filiali', path: '/admin/branches' },
  { label: 'statistiche', path: '/admin/stats' },
  { label: 'profilo', path: '/profile' }
];

/* le sezioni operative stanno nella directory laterale, il profilo resta solo
   nella barra in alto */
const directoryLinks = links.slice(0, 4);

export function AdminShell({ children, title = 'admin-ops', subtitle = 'system control' }) {
  const { user } = useAuthStore();
  const currentPath = window.location.pathname;
  return html`
    <div class="crt-noise" aria-hidden="true"></div>
    <main class="console management-shell" aria-label="Administrator operations console">
      <${TitleBar} section=${title} context=${subtitle} status="admin online" links=${links} showClock=${false} />
      <section class="identity-strip">
        <div class="brand-block"><span class="prompt">admin@burger:~$</span><h1>BURGER<br /><em>.SH</em></h1></div>
        <div class="system-copy"><p class="eyebrow">platform administration / 00</p><p>Gestisci utenti, filiali e salute della piattaforma.</p></div>
        <div class="shift-stamp"><span>SECURITY</span><b>ROOT ACCESS</b><small>admin / verified</small></div>
      </section>
      <div class="management-grid">
        <nav class="command-list" aria-label="Admin directory">
          <p class="eyebrow">directory</p>
          ${directoryLinks.map((link, index) => html`<button class=${`nav-command ${link.path === currentPath ? 'active' : ''}`} type="button" onClick=${() => navigate(link.path)}><kbd>0${index + 1}</kbd> ${link.label}</button>`)}
          <div class="nav-footer"><span>tty / admin</span><span>scope / platform</span><span>user / ${user?.name || 'admin'}</span></div>
        </nav>
        <section class="workspace"><header class="workspace-head"><p>access <b>GRANTED</b></p></header><div>${children}</div></section>
      </div>
      <footer class="footer-status"><span><b>F1</b> help</span><span><b>esc</b> back</span><span class="live-command">admin@burger:~$ <i></i></span></footer>
    </main>
  `;
}

export default AdminShell;

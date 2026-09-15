import { html } from '../../utils/htm.js';
import { TitleBar } from './TitleBar.jsx';
import { useAuthStore } from '../../state/authStore.js';
import { navigate } from '../../router/navigate.js';

const links = [
  { label: 'dashboard', path: '/dashboard/manager' },
  { label: 'ordini', path: '/manager/orders' },
  { label: 'menu', path: '/manager/menu' },
  { label: 'profilo', path: '/profile' }
];

export function ManagerShell({ children, title = 'manager-ops', subtitle = 'restaurant control' }) {
  const { user } = useAuthStore();
  return html`
    <div class="crt-noise" aria-hidden="true"></div>
    <main class="console management-shell" aria-label="Manager operations console">
      <${TitleBar} section=${title} context=${subtitle} status="manager online" links=${links} showClock=${false} />
      <section class="identity-strip">
        <div class="brand-block"><span class="prompt">manager@burger:~$</span><h1>BURGER<br /><em>.SH</em></h1></div>
        <div class="system-copy"><p class="eyebrow">restaurant operations / 01</p><p>Controlla ordini, menu e attività della tua filiale.</p></div>
        <div class="shift-stamp"><span>OPERATOR</span><b>${user?.name || 'MANAGER'}</b><small>manager / ${user?.managerStatus || 'pending'}</small></div>
      </section>
      <div class="management-grid">
        <nav class="command-list" aria-label="Manager directory">
          <p class="eyebrow">directory</p>
          ${links.slice(0, 3).map((link, index) => html`<button class="nav-command" type="button" onClick=${() => navigate(link.path)}><kbd>0${index + 1}</kbd> ${link.label}</button>`)}
          <div class="nav-footer"><span>tty / manager</span><span>scope / restaurant</span><span>user / ${user?.name || 'manager'}</span></div>
        </nav>
        <section class="workspace"><header class="workspace-head"><p>access <b>GRANTED</b></p></header><div>${children}</div></section>
      </div>
      <footer class="footer-status"><span><b>F1</b> help</span><span><b>esc</b> back</span><span class="live-command">manager@burger:~$ <i></i></span></footer>
    </main>
  `;
}

export default ManagerShell;

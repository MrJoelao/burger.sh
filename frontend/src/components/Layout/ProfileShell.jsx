/*
 * ProfileShell - cornice della schermata profilo. È una console a sé: non ha
 * la directory operativa né la barra "access granted" delle console di lavoro,
 * ma conserva titlebar, striscia identità e footer per restare coerente col
 * resto del terminale. I collegamenti in alto riportano nell'area del ruolo.
 */

import { html } from '../../utils/htm.js';
import { TitleBar } from './TitleBar.jsx';
import { useAuthStore } from '../../state/authStore.js';
import { roleLabels } from '../../domain/roles.js';

const AREA_LINKS = {
  customer: [
    { label: 'ordina', path: '/menu' },
    { label: 'ordini', path: '/orders' },
    { label: 'profilo', path: '/profile' }
  ],
  manager: [
    { label: 'dashboard', path: '/dashboard/manager' },
    { label: 'ordini', path: '/manager/orders' },
    { label: 'menu', path: '/manager/menu' },
    { label: 'profilo', path: '/profile' }
  ],
  admin: [
    { label: 'dashboard', path: '/dashboard/admin' },
    { label: 'utenti', path: '/admin/users' },
    { label: 'filiali', path: '/admin/branches' },
    { label: 'statistiche', path: '/admin/stats' },
    { label: 'profilo', path: '/profile' }
  ]
};

const AREA_COPY = {
  customer: {
    prompt: 'guest@burger:~$',
    eyebrow: 'account personale / 04',
    copy: 'Aggiorna i tuoi dati, le preferenze e l’accesso.',
    stamp: 'CLIENTE'
  },
  manager: {
    prompt: 'manager@burger:~$',
    eyebrow: 'account operatore / 04',
    copy: 'I tuoi dati di accesso e la gestione della filiale.',
    stamp: 'OPERATORE'
  },
  admin: {
    prompt: 'admin@burger:~$',
    eyebrow: 'account amministratore / 04',
    copy: 'Dati, sicurezza e sessione della console amministratore.',
    stamp: 'SECURITY'
  }
};

/* sotto il nome nello stamp: per il manager lo stato di approvazione conta */
function stampDetail(user, role) {
  if (role === 'manager') return `manager / ${user?.managerStatus || 'pending'}`;
  return `${roleLabels[role] || role} / verified`;
}

export function ProfileShell({ children }) {
  const { user } = useAuthStore();
  const role = user?.role || 'customer';
  const links = AREA_LINKS[role] || AREA_LINKS.customer;
  const copy = AREA_COPY[role] || AREA_COPY.customer;
  const fullName = [user?.name, user?.surname].filter(Boolean).join(' ') || role;

  return html`
    <div class="crt-noise" aria-hidden="true"></div>
    <main class="console profile-console" aria-label="Account personale Burger.sh">
      <${TitleBar}
        section="profile"
        context=${copy.stamp.toLowerCase()}
        status=${`${role} online`}
        links=${links}
        showClock=${false}
      />

      <section class="identity-strip">
        <div class="brand-block"><span class="prompt">${copy.prompt}</span><h1>BURGER<br /><em>.SH</em></h1></div>
        <div class="system-copy"><p class="eyebrow">${copy.eyebrow}</p><p>${copy.copy}</p></div>
        <div class="shift-stamp"><span>${copy.stamp}</span><b>${fullName}</b><small>${stampDetail(user, role)}</small></div>
      </section>

      <section class="profile-screen">${children}</section>

      <footer class="footer-status">
        <span><b>F1</b> help</span>
        <span><b>↑ ↓</b> sezioni</span>
        <span class="live-command">${copy.prompt} <i></i></span>
      </footer>
    </main>
  `;
}

export default ProfileShell;

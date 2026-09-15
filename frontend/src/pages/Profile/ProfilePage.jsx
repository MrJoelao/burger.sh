/**
 * ProfilePage - sezione profilo, organizzata in pannelli con un indice
 * laterale. Le sezioni dipendono dal ruolo: il cliente ha in più le
 * preferenze, manager e admin vedono i propri dati e la sicurezza.
 * Ogni pannello salva solo i campi che gli competono.
 */

import { useState } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { TerminalWindow } from '../../components/Layout/TerminalWindow.jsx';
import { ManagerShell } from '../../components/Layout/ManagerShell.jsx';
import { AdminShell } from '../../components/Layout/AdminShell.jsx';
import { SectionHeading } from '../../components/UI/SectionHeading.jsx';
import { useAuthStore } from '../../state/authStore.js';
import { profileSections } from '../../domain/profile.js';
import { ProfileIndex } from './components/ProfileIndex.jsx';
import { IdentityPanel } from './components/IdentityPanel.jsx';
import { AddressPanel } from './components/AddressPanel.jsx';
import { PreferencesPanel } from './components/PreferencesPanel.jsx';
import { SecurityPanel } from './components/SecurityPanel.jsx';
import { AccountPanel } from './components/AccountPanel.jsx';

export function ProfilePage() {
  const { user } = useAuthStore();
  const sections = profileSections(user?.role);
  const [activeId, setActiveId] = useState(sections[0]?.id || '');

  const content = html`
    <section class="terminal-screen">
      <${SectionHeading}
        eyebrow="identity"
        title="PROFILO_"
        titleSpan=${user?.name || 'UTENTE'}
        subtitle="dati, preferenze e accesso al tuo account"
      />

      <div class="profile-layout">
        <${ProfileIndex} sections=${sections} activeId=${activeId} onSelect=${setActiveId} />

        <div class="profile-panels">
          <${IdentityPanel} />
          <${AddressPanel} />
          ${user?.role === 'customer' && html`<${PreferencesPanel} />`}
          <${SecurityPanel} />
          <${AccountPanel} />
        </div>
      </div>
    </section>
  `;

  if (user?.role === 'manager') return html`<${ManagerShell} title="profile">${content}<//>`;
  if (user?.role === 'admin') return html`<${AdminShell} title="profile">${content}<//>`;
  return html`<${TerminalWindow} title="profile" subtitle="identity">${content}<//>`;
}

export default ProfilePage;

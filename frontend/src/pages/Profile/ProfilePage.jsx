/**
 * ProfilePage - schermata del profilo, a sé rispetto alle console di lavoro.
 * L'indice a sinistra fa da selettore: si vede una sola sezione alla volta e
 * tutte restano montate, così passare da una sezione all'altra non butta via
 * quello che l'utente ha scritto ma non ha ancora salvato.
 * Le sezioni dipendono dal ruolo (il cliente ha in più le preferenze).
 */

import { useState } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { ProfileShell } from '../../components/Layout/ProfileShell.jsx';
import { useAuthStore } from '../../state/authStore.js';
import { profileSections } from '../../domain/profile.js';
import { ProfileIndex } from './components/ProfileIndex.jsx';
import { IdentityPanel } from './components/IdentityPanel.jsx';
import { AddressPanel } from './components/AddressPanel.jsx';
import { PreferencesPanel } from './components/PreferencesPanel.jsx';
import { SecurityPanel } from './components/SecurityPanel.jsx';
import { AccountPanel } from './components/AccountPanel.jsx';

/* una sezione dell'indice corrisponde a un pannello: la mappa evita di
   decidere in render quali sezioni mostrare per ruolo, lo fa profileSections */
const PANELS = {
  anagrafica: IdentityPanel,
  indirizzo: AddressPanel,
  preferenze: PreferencesPanel,
  sicurezza: SecurityPanel,
  account: AccountPanel
};

export function ProfilePage() {
  const { user } = useAuthStore();
  const sections = profileSections(user?.role);
  const [selectedId, setSelectedId] = useState(sections[0]?.id || '');

  /* se il ruolo cambia e la sezione scelta non esiste più (o non esiste
     ancora al primo render) ricado sulla prima disponibile */
  const activeId = sections.some(section => section.id === selectedId)
    ? selectedId
    : sections[0]?.id || '';

  return html`
    <${ProfileShell}>
      <${ProfileIndex} sections=${sections} activeId=${activeId} onSelect=${setSelectedId} />

      <div class="profile-panels">
        ${sections.map(section => {
          const Panel = PANELS[section.id];
          if (!Panel) return null;
          return html`<${Panel} key=${section.id} active=${activeId === section.id} />`;
        })}
      </div>
    <//>
  `;
}

export default ProfilePage;

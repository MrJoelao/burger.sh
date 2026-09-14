/**
 * AdminUsers - directory degli utenti della piattaforma.
 * Filtri per ruolo e stato manager, e le azioni globali dell'admin: approvare o
 * rifiutare un manager in attesa, eliminare un account. L'eliminazione di un
 * manager chiude la sua filiale: per trasferirla prima, si passa da "filiali".
 */

import { useState, useCallback } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { AdminShell } from '../../components/Layout/AdminShell.jsx';
import { SectionHeading } from '../../components/UI/SectionHeading.jsx';
import { TerminalButton } from '../../components/Auth/TerminalButton.jsx';
import { managerAdminService } from '../../services/managerAdminService.js';
import { useAuthStore } from '../../state/authStore.js';
import { roleLabels } from '../../domain/roles.js';
import { userQuery, userId, isPendingManager, managerStatusLabels } from '../../domain/admin.js';
import { roleTones, managerStatusTones } from './tones.js';
import { useAdminResource, useAdminAction } from './hooks.js';
import { AsyncBoundary } from './components/AsyncBoundary.jsx';
import { ConfirmAction } from './components/ConfirmAction.jsx';

const ROLE_OPTIONS = ['', 'customer', 'manager', 'admin'];
const STATUS_OPTIONS = ['', 'pending', 'approved'];

export function AdminUsers() {
  const { user: currentUser } = useAuthStore();
  const [filters, setFilters] = useState({ role: '', managerStatus: '' });
  const { role, managerStatus } = filters;

  const load = useCallback(
    () => managerAdminService.getAllUsers(userQuery({ role, managerStatus })),
    [role, managerStatus]
  );
  const users = useAdminResource(load);
  const action = useAdminAction({ onSuccess: users.reload });

  const decide = (id, nextStatus) => action.run(id, () => managerAdminService.updateUser(id, { managerStatus: nextStatus }));
  const remove = (id) => action.run(id, () => managerAdminService.deleteUser(id));

  return html`
    <${AdminShell} title="utenti" subtitle="user directory">
      <section class="terminal-screen">
        <${SectionHeading}
          eyebrow="utenti"
          title="DIRECTORY_"
          titleSpan="UTENTI"
          subtitle="filtra per ruolo e gestisci gli account"
        />

        ${action.actionError && html`
          <div class="alert alert-danger" role="alert"><strong>errore:</strong> ${action.actionError}</div>
        `}

        <div class="filter-row">
          <label class="filter-field">ruolo
            <select
              value=${role}
              onChange=${(event) => setFilters({ role: event.currentTarget.value, managerStatus: '' })}
            >
              ${ROLE_OPTIONS.map(value => html`
                <option value=${value}>${value ? roleLabels[value] : 'tutti'}</option>
              `)}
            </select>
          </label>
          <label class="filter-field">stato manager
            <select
              disabled=${role !== 'manager'}
              value=${managerStatus}
              onChange=${(event) => setFilters(previous => ({ ...previous, managerStatus: event.currentTarget.value }))}
            >
              ${STATUS_OPTIONS.map(value => html`
                <option value=${value}>${value ? managerStatusLabels[value] : 'tutti'}</option>
              `)}
            </select>
          </label>
        </div>

        <${AsyncBoundary} loading=${users.loading} error=${users.error} label="utenti">
          ${renderUsers(users.response?.data || [], action.busyId, userId(currentUser), decide, remove)}
        <//>
      </section>
    <//>
  `;
}

function renderUsers(users, busyId, selfId, decide, remove) {
  if (users.length === 0) {
    return html`<p class="queue-empty"><b>_</b> nessun utente per questo filtro.</p>`;
  }

  return html`
    <div class="table-scroll">
      <table class="directory-table">
      <thead>
        <tr>
          <th>identità</th>
          <th>ruolo</th>
          <th>stato</th>
          <th>azioni</th>
        </tr>
      </thead>
      <tbody>
        ${users.map(user => {
          const id = userId(user);
          const busy = busyId === id;

          return html`
            <tr key=${id}>
              <td class="cell-identity">
                <b>${user.name} ${user.surname || ''}</b>
                <span>${user.email}</span>
              </td>
              <td>
                <span class=${`tag tone-${roleTones[user.role] || 'dirty'}`}>
                  ${roleLabels[user.role] || user.role}
                </span>
              </td>
              <td>
                ${user.managerStatus
                  ? html`<span class=${`tag tone-${managerStatusTones[user.managerStatus] || 'dirty'}`}>${managerStatusLabels[user.managerStatus] || user.managerStatus}</span>`
                  : html`<span class="muted">n/d</span>`}
              </td>
              <td class="cell-actions">
                ${isPendingManager(user) && html`
                  <${TerminalButton} className="compact" primary disabled=${busy} onClick=${() => decide(id, 'approved')}>[ y ] approva<//>
                  <${TerminalButton} className="compact" disabled=${busy} onClick=${() => decide(id, 'rejected')}>[ n ] rifiuta<//>
                `}
                ${id === selfId
                  ? html`<span class="muted">tu</span>`
                  : html`
                    <${ConfirmAction}
                      disabled=${busy}
                      label="[ x ] elimina"
                      confirmLabel=${user.role === 'manager' ? 'eliminare? la filiale verrà chiusa' : 'eliminare l\'account?'}
                      onConfirm=${() => remove(id)}
                    />
                  `}
              </td>
            </tr>
          `;
        })}
      </tbody>
      </table>
    </div>
  `;
}

export default AdminUsers;

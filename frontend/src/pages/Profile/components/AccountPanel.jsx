/**
 * AccountPanel - stato dell'account, uscita dalla sessione ed eliminazione.
 * Un manager proprietario di filiali non può eliminarle per sbaglio: prima
 * sceglie se trasferirle a un altro manager o chiuderle, e solo dopo può
 * confermare. Il body inviato a DELETE /users/me è newManagerId quando si
 * trasferisce, vuoto quando si chiude.
 */

import { useEffect, useState } from 'preact/hooks';
import { html } from '../../../utils/htm.js';
import { useAuthStore } from '../../../state/authStore.js';
import { TerminalButton } from '../../../components/Auth/TerminalButton.jsx';
import { ConfirmAction } from '../../Admin/components/ConfirmAction.jsx';
import { navigate } from '../../../router/navigate.js';
import { restaurantService } from '../../../services/restaurantService.js';
import { userId, managerStatusLabels } from '../../../domain/admin.js';
import { roleLabels } from '../../../domain/roles.js';
import { ownedBranches, successorManagers } from '../../../domain/profile.js';
import { Panel } from './Panel.jsx';

export function AccountPanel({ active = true }) {
  const { user, logout, deleteAccount } = useAuthStore();
  const managerId = userId(user);
  const isManager = user?.role === 'manager';

  const [branches, setBranches] = useState([]);
  const [branchError, setBranchError] = useState('');
  const [branchMode, setBranchMode] = useState('trasferisci');
  const [successorId, setSuccessorId] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (!isManager) return undefined;

    let cancelled = false;

    restaurantService.getRestaurants({ limit: 100 })
      .then(response => { if (!cancelled) setBranches(response?.data || []); })
      .catch(error => { if (!cancelled) setBranchError(error.message || 'filiali non disponibili'); });

    return () => { cancelled = true; };
  }, [isManager]);

  const owned = isManager ? ownedBranches(branches, managerId) : [];
  const successors = isManager ? successorManagers(branches, managerId) : [];
  const transferring = owned.length > 0 && branchMode === 'trasferisci';
  const deleteDisabled = busy || (transferring && !successorId);

  const leaveAccount = () => {
    logout();
    navigate('/');
  };

  const confirmDelete = async () => {
    setBusy(true);
    setDeleteError('');

    const result = await deleteAccount(transferring ? { newManagerId: successorId } : {});

    if (result?.success) {
      navigate('/');
      return;
    }

    setDeleteError(result?.message || 'impossibile eliminare l’account');
    setBusy(false);
  };

  return html`
    <${Panel} id="account" eyebrow="sessione" title="GESTIONE_" titleSpan="ACCOUNT" active=${active}>
      <dl class="profile-status">
        <div><dt>ruolo</dt><dd>${roleLabels[user?.role] || user?.role || '—'}</dd></div>
        ${user?.managerStatus && html`
          <div><dt>stato manager</dt><dd>${managerStatusLabels[user.managerStatus] || user.managerStatus}</dd></div>
        `}
        <div><dt>email</dt><dd>${user?.email || '—'}</dd></div>
      </dl>

      <div class="profile-actions">
        <${TerminalButton} onClick=${leaveAccount}>[ esc ] esci dall’account<//>
      </div>

      <div class="profile-danger">
        <p class="eyebrow">zona critica</p>
        <p class="profile-danger-copy">Eliminare l’account è definitivo: i tuoi dati non saranno recuperabili.</p>

        ${branchError && html`<p class="profile-field-help error">${branchError}</p>`}

        ${owned.length > 0 && html`
          <div class="profile-branch-transfer">
            <p class="profile-danger-copy">
              Gestisci ${owned.length} filial${owned.length === 1 ? 'e' : 'i'}:
            </p>
            <ul class="profile-branch-list">
              ${owned.map(branch => html`<li key=${userId(branch)}>${branch.name}</li>`)}
            </ul>

            <label class="profile-field">
              gestione filiali
              <select value=${branchMode} onChange=${event => setBranchMode(event.currentTarget.value)}>
                <option value="trasferisci">trasferisci a un altro manager</option>
                <option value="chiudi">chiudi le filiali</option>
              </select>
            </label>

            ${transferring && html`
              <label class="profile-field">
                manager subentrante
                <select value=${successorId} onChange=${event => setSuccessorId(event.currentTarget.value)}>
                  <option value="">scegli manager</option>
                  ${successors.map(manager => html`
                    <option value=${userId(manager)}>${manager.name} ${manager.surname || ''}</option>
                  `)}
                </select>
              </label>
            `}
          </div>
        `}

        ${deleteError && html`<p class="profile-field-help error">${deleteError}</p>`}

        <div class="profile-actions">
          <${ConfirmAction}
            label="[ x ] elimina account"
            confirmLabel="eliminare l’account?"
            disabled=${deleteDisabled}
            onConfirm=${confirmDelete}
          />
        </div>
      </div>
    <//>
  `;
}

export default AccountPanel;

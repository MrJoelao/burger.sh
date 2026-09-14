/**
 * AdminBranches - gestione delle filiali.
 * L'admin apre una nuova filiale assegnandola a un manager approvato, oppure
 * trasferisce o chiude una filiale esistente. Il trasferimento usa la DELETE
 * con newManagerId, che è l'unico canale previsto dall'API (vedi openapi.yaml).
 */

import { useState, useCallback } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { AdminShell } from '../../components/Layout/AdminShell.jsx';
import { SectionHeading } from '../../components/UI/SectionHeading.jsx';
import { TerminalButton } from '../../components/Auth/TerminalButton.jsx';
import { restaurantService } from '../../services/restaurantService.js';
import { managerAdminService } from '../../services/managerAdminService.js';
import { userId } from '../../domain/admin.js';
import { useAdminResource, useAdminAction } from './hooks.js';
import { AsyncBoundary } from './components/AsyncBoundary.jsx';
import { ConfirmAction } from './components/ConfirmAction.jsx';

export function AdminBranches() {
  const branches = useAdminResource(useCallback(() => restaurantService.getRestaurants({ limit: 50 }), []));
  const managers = useAdminResource(
    useCallback(() => managerAdminService.getAllUsers({ role: 'manager', managerStatus: 'approved', limit: 100 }), [])
  );
  const [formEpoch, setFormEpoch] = useState(0);
  const action = useAdminAction({ onSuccess: branches.reload });

  const approvedManagers = managers.response?.data || [];

  const createBranch = (form) => action.run('create', async () => {
    await restaurantService.createRestaurant(form);
    setFormEpoch(epoch => epoch + 1);
  });
  const transferBranch = (id, newManagerId) => action.run(id, () => restaurantService.deleteRestaurant(id, { newManagerId }));
  const closeBranch = (id) => action.run(id, () => restaurantService.deleteRestaurant(id));

  return html`
    <${AdminShell} title="filiali" subtitle="branch control">
      <section class="terminal-screen">
        <${SectionHeading}
          eyebrow="filiali"
          title="PUNTI_"
          titleSpan="VENDITA"
          subtitle="apri una filiale o gestisci quelle esistenti"
        />

        ${action.actionError && html`
          <div class="alert alert-danger" role="alert"><strong>errore:</strong> ${action.actionError}</div>
        `}

        <div class="panel-block">
          <${SectionHeading} eyebrow="nuova" title="APRI_" titleSpan="FILIALE" />
          ${approvedManagers.length === 0
            ? html`<p class="queue-empty"><b>_</b> serve almeno un manager approvato per aprire una filiale.</p>`
            : html`<${BranchForm} key=${formEpoch} managers=${approvedManagers} busy=${action.busyId === 'create'} onCreate=${createBranch} />`}
        </div>

        <div class="panel-block">
          <${SectionHeading} eyebrow="elenco" title="FILIALI_" titleSpan="ATTIVE" />
          <${AsyncBoundary} loading=${branches.loading} error=${branches.error} label="filiali">
            ${renderBranches(branches.response?.data || [], approvedManagers, action.busyId, transferBranch, closeBranch)}
          <//>
        </div>
      </section>
    <//>
  `;
}

function renderBranches(branches, managers, busyId, onTransfer, onClose) {
  if (branches.length === 0) {
    return html`<p class="queue-empty"><b>_</b> nessuna filiale aperta.</p>`;
  }

  return html`
    <div class="branch-grid">
      ${branches.map(branch => html`
        <${BranchCard}
          key=${userId(branch)}
          branch=${branch}
          managers=${managers}
          busy=${busyId === userId(branch)}
          onTransfer=${onTransfer}
          onClose=${onClose}
        />
      `)}
    </div>
  `;
}

function BranchCard({ branch, managers, busy, onTransfer, onClose }) {
  const [target, setTarget] = useState('');
  const id = userId(branch);
  const owner = typeof branch.managerId === 'object' ? branch.managerId : null;
  /* trasferire a chi la filiale ce l'ha già non ha senso: lo tolgo dalle opzioni */
  const transferTargets = managers.filter(manager => userId(manager) !== userId(owner));

  return html`
    <article class="branch-card">
      <header class="branch-head">
        <b>${branch.name}</b>
        <span class="eyebrow">${branch.city}</span>
      </header>

      <dl class="branch-meta">
        <div><dt>indirizzo</dt><dd>${branch.address}</dd></div>
        <div><dt>telefono</dt><dd>${branch.phone || 'n/d'}</dd></div>
        <div><dt>partita iva</dt><dd>${branch.vatNumber || 'n/d'}</dd></div>
        <div><dt>manager</dt><dd>${owner ? `${owner.name} ${owner.surname || ''}` : 'non assegnato'}</dd></div>
      </dl>

      <div class="branch-actions">
        <label class="filter-field">trasferisci a
          <select value=${target} onChange=${(event) => setTarget(event.currentTarget.value)}>
            <option value="">scegli manager</option>
            ${transferTargets.map(manager => html`
              <option value=${userId(manager)}>${manager.name} ${manager.surname || ''}</option>
            `)}
          </select>
        </label>
        <${ConfirmAction}
          disabled=${busy || !target}
          label="[ t ] trasferisci"
          confirmLabel="trasferire la filiale?"
          onConfirm=${() => onTransfer(id, target)}
        />
        <${ConfirmAction}
          disabled=${busy}
          label="[ x ] chiudi"
          confirmLabel="chiudere la filiale e i suoi piatti?"
          onConfirm=${() => onClose(id)}
        />
      </div>
    </article>
  `;
}

function BranchForm({ managers, busy, onCreate }) {
  const [form, setForm] = useState({ name: '', address: '', city: '', phone: '', vatNumber: '', managerId: '' });
  const setField = (field, value) => setForm(previous => ({ ...previous, [field]: value }));

  const submit = (event) => {
    event.preventDefault();
    onCreate(form);
  };

  return html`
    <form class="profile-form" onSubmit=${submit}>
      <div class="profile-grid">
        ${[['name', 'nome'], ['address', 'indirizzo'], ['city', 'città'], ['phone', 'telefono'], ['vatNumber', 'partita iva']].map(([key, label]) => html`
          <label>${label}<input value=${form[key]} onInput=${(event) => setField(key, event.currentTarget.value)} /></label>
        `)}
        <label>manager
          <select value=${form.managerId} onChange=${(event) => setField('managerId', event.currentTarget.value)}>
            <option value="">scegli manager approvato</option>
            ${managers.map(manager => html`
              <option value=${userId(manager)}>${manager.name} ${manager.surname || ''}</option>
            `)}
          </select>
        </label>
      </div>
      <${TerminalButton} primary type="submit" disabled=${busy || !form.managerId}>
        ${busy ? '[ ... ] apertura' : '[ enter ] apri filiale'}
      <//>
    </form>
  `;
}

export default AdminBranches;

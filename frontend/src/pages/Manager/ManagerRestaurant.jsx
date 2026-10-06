/**
 * ManagerRestaurant - anagrafica della propria sede.
 * Il manager aggiorna i dati della filiale e, se vuole dismetterla, la chiude
 * in autonomia. Il passaggio a un altro manager resta una decisione dell'admin,
 * perché il manager non ha modo di elencare i colleghi approvati (GET
 * /admin/users è riservata all'admin).
 */

import { useCallback, useState } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { ManagerShell } from '../../components/Layout/ManagerShell.jsx';
import { SectionHeading } from '../../components/UI/SectionHeading.jsx';
import { ConfirmAction } from '../../components/Console/ConfirmAction.jsx';
import { restaurantService } from '../../services/restaurantService.js';
import { useAuthStore } from '../../state/authStore.js';
import { navigate } from '../../router/navigate.js';
import { branchIdOf } from '../../domain/branch.js';
import { useResource, useAction } from '../../hooks/useResource.js';
import { BranchGate } from './components/BranchGate.jsx';
import { BranchForm } from './components/BranchForm.jsx';

const EMPTY_BRANCH = { success: true, data: {} };

export function ManagerRestaurant() {
  const { user, refreshUser } = useAuthStore();
  const branchId = branchIdOf(user);
  const [feedback, setFeedback] = useState('');

  const load = useCallback(
    () => (branchId ? restaurantService.getRestaurant(branchId) : Promise.resolve(EMPTY_BRANCH)),
    [branchId]
  );
  const branch = useResource(load);
  const action = useAction();

  const save = (payload) => action.run('save', async () => {
    setFeedback('');
    const result = await restaurantService.updateRestaurant(branchId, payload);

    if (!result?.success) throw new Error(result?.message || 'impossibile aggiornare la sede');

    setFeedback('sede aggiornata');
    await branch.reload();
    await refreshUser();
  });

  const closeBranch = () => action.run('close', async () => {
    const result = await restaurantService.deleteRestaurant(branchId);

    if (!result?.success) throw new Error(result?.message || 'impossibile chiudere la sede');

    await refreshUser();
    navigate('/dashboard/manager');
  });

  const branchData = branch.response?.data || {};

  return html`
    <${ManagerShell} title="sede" subtitle="branch profile">
      <section class="terminal-screen">
        <${SectionHeading}
          eyebrow="filiale"
          title="DATI_"
          titleSpan="DELLA SEDE"
          subtitle="anagrafica della filiale e dismissione della stessa"
        />

        ${action.actionError && html`
          <div class="alert alert-danger" role="alert"><strong>errore:</strong> ${action.actionError}</div>
        `}
        ${feedback && html`<p class="profile-feedback ok" role="status">${feedback}</p>`}

        <${BranchGate}
          branchId=${branchId}
          loading=${branch.loading}
          error=${branch.error}
          label="sede"
          area="l'anagrafica della sede"
        >
          <div class="panel-block">
            <${SectionHeading} eyebrow="anagrafica" title="MODIFICA_" titleSpan="SEDE" />
            <${BranchForm}
              key=${branchId}
              branch=${branchData}
              busy=${action.busyId === 'save'}
              onSubmit=${save}
            />
          </div>

          <div class="panel-block profile-danger">
            <p class="eyebrow">zona critica</p>
            <p class="profile-danger-copy">
              Chiudere la sede è definitivo: la filiale sparisce con tutti i suoi piatti custom.
              Per passarla a un altro manager, chiedi all'admin.
            </p>
            <div class="profile-actions">
              <${ConfirmAction}
                label="[ x ] chiudi la sede"
                confirmLabel="chiudere la sede e i suoi piatti?"
                disabled=${action.busyId === 'close'}
                onConfirm=${closeBranch}
              />
            </div>
          </div>
        <//>
      </section>
    <//>
  `;
}

export default ManagerRestaurant;

/**
 * ManagerMenu - menu della filiale.
 * Il menu comune resta di sola lettura: il manager crea, modifica ed elimina
 * solo i piatti custom della propria sede. Il form serve sia a creare sia a
 * modificare, cambia solo il piatto di partenza.
 */

import { useCallback, useState } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { ManagerShell } from '../../components/Layout/ManagerShell.jsx';
import { SectionHeading } from '../../components/UI/SectionHeading.jsx';
import { restaurantService } from '../../services/restaurantService.js';
import { useAuthStore } from '../../state/authStore.js';
import { branchIdOf } from '../../domain/branch.js';
import { useResource, useAction } from '../../hooks/useResource.js';
import { canManageDish, menuGroups } from '../../domain/menu.js';
import { entityId } from '../../domain/entity.js';
import { BranchGate } from './components/BranchGate.jsx';
import { DishForm } from './components/DishForm.jsx';
import { DishTable } from './components/DishTable.jsx';

const EMPTY_LIST = { success: true, data: [] };

export function ManagerMenu() {
  const { user } = useAuthStore();
  const branchId = branchIdOf(user);
  const [editing, setEditing] = useState(null);
  const [formEpoch, setFormEpoch] = useState(0);

  const load = useCallback(
    () => (branchId ? restaurantService.getDishesByRestaurant(branchId, { limit: 100 }) : Promise.resolve(EMPTY_LIST)),
    [branchId]
  );
  const dishes = useResource(load);
  const action = useAction({ onSuccess: dishes.reload });

  const list = dishes.response?.data || [];
  const { custom, common } = menuGroups(list);
  const isManageable = dish => canManageDish(dish, { role: user?.role, restaurantId: branchId });

  const busyKey = editing ? entityId(editing) : 'create';

  const submitDish = (payload) => action.run(busyKey, async () => {
    if (editing) {
      await restaurantService.updateDish(entityId(editing), payload);
    } else {
      await restaurantService.createDish(branchId, payload);
      setFormEpoch(epoch => epoch + 1);
    }

    setEditing(null);
  });

  const removeDish = id => action.run(id, () => restaurantService.deleteDish(id));

  return html`
    <${ManagerShell} title="menu" subtitle="branch menu">
      <section class="terminal-screen">
        <${SectionHeading}
          eyebrow="filiale"
          title="MENU_"
          titleSpan="DELLA SEDE"
          subtitle="gestisci i piatti custom: il menu comune è condiviso e non modificabile"
        />

        ${action.actionError && html`
          <div class="alert alert-danger" role="alert"><strong>errore:</strong> ${action.actionError}</div>
        `}

        <${BranchGate}
          branchId=${branchId}
          loading=${dishes.loading}
          error=${dishes.error}
          label="menu"
          area="il menu"
        >
          <div class="panel-block">
            <${SectionHeading}
              eyebrow=${editing ? 'modifica' : 'nuovo'}
              title=${editing ? 'MODIFICA_' : 'AGGIUNGI_'}
              titleSpan="PIATTO CUSTOM"
            />
            <${DishForm}
              key=${editing ? entityId(editing) : `new-${formEpoch}`}
              initial=${editing}
              busy=${action.busyId === busyKey}
              onSubmit=${submitDish}
              onCancel=${editing ? () => setEditing(null) : null}
            />
          </div>

          <div class="panel-block">
            <${SectionHeading} eyebrow="custom" title="PIATTI_" titleSpan="DELLA SEDE" />
            <${DishTable}
              dishes=${custom}
              busyId=${action.busyId}
              canManage=${isManageable}
              onEdit=${setEditing}
              onDelete=${removeDish}
            />
          </div>

          <div class="panel-block">
            <${SectionHeading} eyebrow="condiviso" title="MENU_" titleSpan="COMUNE" />
            <${DishTable}
              dishes=${common}
              busyId=${action.busyId}
              canManage=${isManageable}
              onEdit=${setEditing}
              onDelete=${removeDish}
            />
          </div>
        <//>
      </section>
    <//>
  `;
}

export default ManagerMenu;

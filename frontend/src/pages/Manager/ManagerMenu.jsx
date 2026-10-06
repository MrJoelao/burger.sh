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
import { TerminalButton } from '../../components/Auth/TerminalButton.jsx';
import { restaurantService } from '../../services/restaurantService.js';
import { useAuthStore } from '../../state/authStore.js';
import { branchIdOf } from '../../domain/branch.js';
import { useResource, useAction } from '../../hooks/useResource.js';
import { canManageDish, menuSections } from '../../domain/menu.js';
import { filterDishes } from '../../domain/menuSearch.js';
import { entityId } from '../../domain/entity.js';
import { BranchGate } from './components/BranchGate.jsx';
import { DishForm } from './components/DishForm.jsx';
import { DishTable } from './components/DishTable.jsx';
import { MenuSearch } from '../../components/Menu/MenuSearch.jsx';

const EMPTY_LIST = { success: true, data: [] };

export function ManagerMenu() {
  const { user } = useAuthStore();
  const branchId = branchIdOf(user);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formEpoch, setFormEpoch] = useState(0);
  const [searchFilters, setSearchFilters] = useState({});

  const load = useCallback(
    () => (branchId ? restaurantService.getDishesByRestaurant(branchId, { limit: 100 }) : Promise.resolve(EMPTY_LIST)),
    [branchId]
  );
  const dishes = useResource(load);
  const action = useAction({ onSuccess: dishes.reload });

  const list = filterDishes(dishes.response?.data || [], searchFilters);
  const sections = menuSections(list);
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
    setShowForm(false);
  });

  const removeDish = id => action.run(id, () => restaurantService.deleteDish(id));

  return html`
    <${ManagerShell} title="menu" subtitle="branch menu">
      <section class="terminal-screen manager-screen">
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
          <div class="menu-command-bar">
            <div><p class="eyebrow">catalogo della sede</p><p>Piatti comuni e custom, organizzati per tipologia.</p></div>
            <${TerminalButton} primary onClick=${() => { setEditing(null); setShowForm(true); }}>[ + ] nuovo piatto custom<//>
          </div>

          <${MenuSearch} dishes=${dishes.response?.data || []} onChange=${setSearchFilters} />

          <div class="panel-block manager-menu-catalog">
            ${sections.length === 0 && html`<p class="queue-empty"><b>_</b> nessun piatto disponibile. Usa “nuovo piatto custom” per iniziare.</p>`}
            ${sections.map(section => html`
              <section class="manager-menu-group" key=${section.type}>
                <${SectionHeading} eyebrow=${`${section.label} · ${section.items.length}`} title=${section.label.toUpperCase()}_ titleSpan="MENU" />
                <${DishTable} dishes=${section.items} busyId=${action.busyId} canManage=${isManageable} onEdit=${dish => { setEditing(dish); setShowForm(true); }} onDelete=${removeDish} />
              </section>
            `)}
          </div>
        <//>
      </section>
      ${showForm && html`
        <div class="manager-modal-backdrop" role="presentation" onClick=${event => event.target === event.currentTarget && setShowForm(false)}>
          <section class="manager-modal" role="dialog" aria-modal="true" aria-labelledby="dish-modal-title">
            <div class="manager-modal-header">
              <div><p class="eyebrow">${editing ? 'modifica' : 'nuovo custom'}</p><h2 id="dish-modal-title">${editing ? 'MODIFICA_' : 'AGGIUNGI_'}<span> PIATTO</span></h2></div>
              <button type="button" class="modal-close" aria-label="chiudi" onClick=${() => setShowForm(false)}>×</button>
            </div>
            <${DishForm} key=${editing ? entityId(editing) : `new-${formEpoch}`} initial=${editing} busy=${action.busyId === busyKey} onSubmit=${submitDish} onCancel=${() => setShowForm(false)} />
          </section>
        </div>
      `}
    <//>
  `;
}

export default ManagerMenu;

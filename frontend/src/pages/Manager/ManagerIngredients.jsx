import { useCallback, useState } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { ManagerShell } from '../../components/Layout/ManagerShell.jsx';
import { SectionHeading } from '../../components/UI/SectionHeading.jsx';
import { TerminalButton } from '../../components/Auth/TerminalButton.jsx';
import { ConfirmAction } from '../../components/Console/ConfirmAction.jsx';
import { BranchGate } from './components/BranchGate.jsx';
import { restaurantService } from '../../services/restaurantService.js';
import { useAuthStore } from '../../state/authStore.js';
import { branchIdOf } from '../../domain/branch.js';
import { useAction, useResource } from '../../hooks/useResource.js';

const EMPTY_LIST = { success: true, data: [] };

export function ManagerIngredients() {
  const { user } = useAuthStore();
  const branchId = branchIdOf(user);
  const [name, setName] = useState('');
  const [allergens, setAllergens] = useState('');
  const [editing, setEditing] = useState(null);
  const load = useCallback(
    () => (branchId ? restaurantService.getIngredients({ limit: 100 }) : Promise.resolve(EMPTY_LIST)),
    [branchId]
  );
  const ingredients = useResource(load);
  const action = useAction({ onSuccess: ingredients.reload });

  const submit = event => {
    event.preventDefault();
    const value = name.trim();
    if (value.length < 2) return;
    action.run(editing?._id || 'ingredient-create', async () => {
      const result = editing
        ? await restaurantService.updateIngredient(
          editing._id,
          value,
          allergens.split(',').map(item => item.trim()).filter(Boolean)
        )
        : await restaurantService.createIngredient(
        value,
        allergens.split(',').map(item => item.trim()).filter(Boolean)
        );
      setName('');
      setAllergens('');
      setEditing(null);
      return result;
    });
  };

  const startEditing = ingredient => {
    setEditing(ingredient);
    setName(ingredient.name);
    setAllergens((ingredient.allergens || []).join(', '));
  };

  const cancelEditing = () => {
    setEditing(null);
    setName('');
    setAllergens('');
  };

  const removeIngredient = id => action.run(id, () => restaurantService.deleteIngredient(id));

  const list = ingredients.response?.data || [];

  return html`
    <${ManagerShell} title="ingredienti" subtitle="ingredient inventory">
      <section class="terminal-screen manager-screen">
        <${SectionHeading}
          eyebrow="filiale"
          title="INGREDIENTI_"
          titleSpan="DELLA SEDE"
          subtitle="gestisci l'archivio condiviso dalla tua sede"
        />
        ${action.actionError && html`<div class="alert alert-danger" role="alert"><strong>errore:</strong> ${action.actionError}</div>`}
        <${BranchGate}
          branchId=${branchId}
          loading=${ingredients.loading}
          error=${ingredients.error}
          label="ingredienti"
          area="gli ingredienti"
        >
          <div class="ingredient-workspace">
            <form class="ingredient-create-panel" onSubmit=${submit} novalidate>
              <div>
                <p class="eyebrow">${editing ? 'modifica ingrediente' : 'nuovo ingrediente'}</p>
                <h3>${editing ? 'MODIFICA_' : 'AGGIUNGI_'} INGREDIENTE</h3>
                <p class="wizard-hint">Crea un ingrediente riutilizzabile nei piatti della sede.</p>
              </div>
              <label>nome<input value=${name} onInput=${event => setName(event.currentTarget.value)} placeholder="es. cheddar" /></label>
              <label>allergeni<input value=${allergens} onInput=${event => setAllergens(event.currentTarget.value)} placeholder="latte, glutine" /></label>
              <${TerminalButton} primary type="submit" disabled=${Boolean(action.busyId)}>
                ${action.busyId ? '[ ... ] salvataggio' : editing ? '[ enter ] salva' : '[ + ] aggiungi'}
              <//>
              ${editing && html`<${TerminalButton} type="button" onClick=${cancelEditing}>[ esc ] annulla<//>`}
            </form>
            <section class="ingredient-catalog" aria-labelledby="ingredient-list-title">
              <div class="catalog-heading">
                <p class="eyebrow" id="ingredient-list-title">disponibili · ${list.length}</p>
                <span>ordinati alfabeticamente</span>
              </div>
              ${list.length === 0
                ? html`<p class="queue-empty"><b>_</b> nessun ingrediente disponibile.</p>`
                : html`<div class="ingredient-grid">${list.map(ingredient => html`
                  <article class="ingredient-card-record" key=${ingredient._id}>
                    <div><h3>${ingredient.name}</h3><p>${ingredient.allergens?.length ? ingredient.allergens.join(' · ') : 'nessun allergene indicato'}</p></div>
                    <div class="ingredient-record-actions">
                      <span class=${`tag ${ingredient.restaurantId || ingredient.managerId ? 'tone-amber' : 'tone-dirty'}`}>
                        ${ingredient.restaurantId || ingredient.managerId ? 'custom' : 'comune'}
                      </span>
                      ${(ingredient.restaurantId || ingredient.managerId) && html`
                        <div class="ingredient-actions">
                          <${TerminalButton} className="compact" onClick=${() => startEditing(ingredient)}>[ e ] modifica<//>
                          <${ConfirmAction} label="[ x ] elimina" confirmLabel="eliminare?" onConfirm=${() => removeIngredient(ingredient._id)} disabled=${Boolean(action.busyId)} />
                        </div>
                      `}
                    </div>
                  </article>
                `)}</div>`}
            </section>
          </div>
        <//>
      </section>
    <//>
  `;
}

export default ManagerIngredients;

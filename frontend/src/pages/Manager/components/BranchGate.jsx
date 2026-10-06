/**
 * BranchGate - decide cosa mostrare a monte del contenuto di una pagina
 * operativa del manager: l'avviso se non ha una filiale (distinguendo un
 * account in attesa da uno che deve ancora aprirla), il caricamento o l'errore
 * della risorsa, oppure il contenuto. Tenerlo qui evita che le quattro pagine
 * ripetano la stessa cascata di stati.
 */

import { html } from '../../../utils/htm.js';
import { useAuthStore } from '../../../state/authStore.js';
import { AsyncBoundary } from '../../../components/Console/AsyncBoundary.jsx';
import { NoBranchNotice } from './NoBranchNotice.jsx';

export function BranchGate({
  branchId,
  loading = false,
  error = '',
  label = 'dati',
  area = 'questa sezione',
  children
}) {
  const { user } = useAuthStore();

  if (!branchId) {
    return html`<${NoBranchNotice} area=${area} pending=${user?.managerStatus !== 'approved'} />`;
  }

  return html`
    <${AsyncBoundary} loading=${loading} error=${error} label=${label}>
      ${children}
    <//>
  `;
}

export default BranchGate;

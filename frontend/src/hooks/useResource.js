/**
 * meccanica asincrona condivisa dalle console di lavoro (manager e admin):
 * caricamento di una risorsa e esecuzione di un'azione con stato di busy ed
 * errore. tenerla qui evita che ogni pagina ripeta lo stesso try/catch con
 * loading, error e reload.
 */

import { useState, useEffect, useCallback } from 'preact/hooks';

export function useResource(loader) {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      setResponse(await loader());
    } catch (err) {
      setError(err.message || 'richiesta non riuscita');
    } finally {
      setLoading(false);
    }
  }, [loader]);

  useEffect(() => { reload(); }, [reload]);

  return { response, loading, error, reload };
}

/* esegue un'azione su un elemento (identificato da id) tenendo traccia di quale
   è in corso e dell'ultimo errore, più la ricarica della risorsa al successo */
export function useAction({ onSuccess } = {}) {
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');

  const run = useCallback(async (id, task) => {
    setBusyId(id);
    setActionError('');

    try {
      await task();
      await onSuccess?.();
    } catch (err) {
      setActionError(err.message || 'operazione non riuscita');
    } finally {
      setBusyId(null);
    }
  }, [onSuccess]);

  return { run, busyId, actionError };
}

export default useResource;

/**
 * Meccanica asincrona condivisa dalle pagine admin: caricamento di una risorsa
 * e esecuzione di un'azione con stato di busy ed errore. Tenerla qui evita che
 * ogni pagina ripeta lo stesso try/catch con loading e error.
 */

import { useState, useEffect, useCallback } from 'preact/hooks';

export function useAdminResource(loader) {
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

export function useAdminAction({ onSuccess } = {}) {
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

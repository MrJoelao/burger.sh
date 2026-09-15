/**
 * normalizzazione degli identificatori che arrivano dall'API: le risposte di
 * login usano `id`, i documenti mongoose serializzati usano `_id`. tenerla in
 * un punto solo evita che ogni pagina decida da sé quale campo leggere.
 */

export function entityId(entity) {
  return entity?.id || entity?._id || '';
}

export default entityId;

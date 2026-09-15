/**
 * formattazione dei valori mostrati nelle console di lavoro: importi in euro e
 * date compatte. tenerla in un punto solo evita che ogni pagina scelga il
 * proprio formato.
 */

export function euro(value) {
  return `€ ${(Number(value) || 0).toFixed(2)}`;
}

export function dateTime(iso) {
  if (!iso) return '';

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

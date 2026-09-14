/**
 * Toni dell'area admin. Qui vivono solo i nomi di classe, il colore vero sta in
 * terminal.css: così nessuna pagina sceglie un hex a mano e i token restano in
 * un posto solo. withTones aggancia il tono a ogni segmento dalla sua chiave.
 */

export const roleTones = { customer: 'paper', manager: 'amber', admin: 'acid' };

export const statusTones = {
  ordered: 'amber',
  confirmed: 'amber',
  preparing: 'amber',
  ready: 'acid',
  on_delivery: 'amber',
  delivered: 'paper',
  cancelled: 'alert'
};

export const managerStatusTones = { pending: 'amber', approved: 'acid', rejected: 'alert' };

export function withTones(segments, tones) {
  return segments.map(segment => ({ ...segment, tone: tones[segment.key] || 'dirty' }));
}

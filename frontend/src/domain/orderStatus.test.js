import { nextStatus, statusFlowFor, statusOrder, filterableStatuses } from './orderStatus.js';

describe('statusFlowFor', () => {
  test('consegna e ritiro hanno flussi diversi', () => {
    expect(statusFlowFor('pickup')).toEqual(['ordered', 'preparing', 'ready', 'delivered']);
    expect(statusFlowFor('delivery')).toEqual(['ordered', 'preparing', 'on_delivery', 'delivered']);
    expect(statusFlowFor(undefined)).toEqual([]);
  });
});

describe('filterableStatuses', () => {
  test('contiene solo gli stati accettati dal filtro del backend, in ordine di flusso', () => {
    expect(filterableStatuses).toEqual(['ordered', 'preparing', 'ready', 'on_delivery', 'delivered']);
  });

  test('esclude i valori di sola UI che il backend non produce mai', () => {
    expect(filterableStatuses).not.toContain('confirmed');
    expect(filterableStatuses).not.toContain('draft');
    expect(filterableStatuses).not.toContain('cancelled');
  });

  test('ogni stato filtrabile è anche uno stato visualizzabile', () => {
    expect(filterableStatuses.every(status => statusOrder.includes(status))).toBe(true);
  });
});

describe('nextStatus', () => {
  test('il ritiro salta on_delivery', () => {
    expect(nextStatus('pickup', 'ordered')).toBe('preparing');
    expect(nextStatus('pickup', 'preparing')).toBe('ready');
    expect(nextStatus('pickup', 'ready')).toBe('delivered');
  });

  test('la consegna salta ready', () => {
    expect(nextStatus('delivery', 'ordered')).toBe('preparing');
    expect(nextStatus('delivery', 'preparing')).toBe('on_delivery');
    expect(nextStatus('delivery', 'on_delivery')).toBe('delivered');
  });

  test('un ordine concluso non ha prossimo stato', () => {
    expect(nextStatus('pickup', 'delivered')).toBeNull();
    expect(nextStatus('delivery', 'delivered')).toBeNull();
  });

  test('stato fuori flusso o modalità ignota non producono transizione', () => {
    expect(nextStatus('pickup', 'draft')).toBeNull();
    expect(nextStatus('pickup', 'on_delivery')).toBeNull();
    expect(nextStatus(null, 'ordered')).toBeNull();
  });
});

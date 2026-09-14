/**
 * OrderBuffer - Right sidebar showing order buffer/cart
 */

const formatEuro = (amount) => `€ ${amount.toFixed(2)}`;

export function OrderBuffer({
  items = [],
  onClear = () => {},
  emptyMessage = 'aggiungi una ricetta per iniziare.',
  showItemCount = true,
  showSubtotal = true
}) {
  const unitCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const subtotal = items.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  return (
    <aside className="order-buffer" aria-label="Buffer ordine">
      <header>
        <p className="eyebrow">order buffer / ram</p>
        <h2>CURRENT<br />BATCH</h2>
        <span className="buffer-mark">rw</span>
      </header>

      <div className="buffer-list" id="buffer-list">
        {!items.length ? (
          <p className="buffer-empty">
            <b>_</b> buffer empty<br />
            <span>{emptyMessage}</span>
          </p>
        ) : (
          items.map((item, index) => (
            <article className="buffer-item" key={`${item.id || item.code || item.name}-${index}`}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <b>{item.name}</b>
                <small>{item.code || ''} · qty {item.quantity || 1}</small>
              </div>
              <strong>{formatEuro((item.price || 0) * (item.quantity || 1))}</strong>
            </article>
          ))
        )}
      </div>

      <footer className="buffer-total">
        {showItemCount && (
          <p><span>units</span><b id="item-count">{String(unitCount).padStart(2, '0')}</b></p>
        )}
        {showSubtotal && (
          <p><span>subtotal</span><strong id="cart-total">{formatEuro(subtotal)}</strong></p>
        )}
        <button type="button" id="clear-buffer" className="terminal-button" onClick={onClear}>
          [ esc ] clear buffer
        </button>
      </footer>
    </aside>
  );
}

export default OrderBuffer;

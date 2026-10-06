import { render, screen, fireEvent } from '@testing-library/preact';
import { OrderBuffer } from './OrderBuffer.jsx';

const ITEM = { name: 'Cheeseburger', price: 6.5, quantity: 1 };

describe('OrderBuffer', () => {
  test('senza gestore non propone il checkout', () => {
    render(<OrderBuffer items={[ITEM]} />);

    expect(screen.queryByRole('button', { name: /checkout/i })).not.toBeInTheDocument();
  });

  test('con un gestore invoca il checkout sul carrello', () => {
    const onCheckout = vi.fn();
    render(<OrderBuffer items={[ITEM]} onCheckout={onCheckout} />);

    fireEvent.click(screen.getByRole('button', { name: /checkout/i }));

    expect(onCheckout).toHaveBeenCalled();
  });

  test('un carrello vuoto non propone il checkout', () => {
    render(<OrderBuffer items={[]} onCheckout={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /checkout/i })).not.toBeInTheDocument();
  });
});

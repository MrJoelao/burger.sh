import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { PaymentMethodList } from './PaymentMethodList.jsx';

const CARD = { _id: 'p1', type: 'card', label: 'Carta di Mario Rossi', details: '4242', isDefault: true };

describe('PaymentMethodList', () => {
  test('elenca i metodi mostrando solo le ultime quattro cifre', () => {
    render(<PaymentMethodList methods={[CARD]} onDelete={() => {}} />);

    expect(screen.getByText('•••• 4242')).toBeInTheDocument();
    expect(screen.getByText('predefinito')).toBeInTheDocument();
  });

  test('senza metodi mostra un invito a salvarne uno', () => {
    render(<PaymentMethodList methods={[]} onDelete={() => {}} />);

    expect(screen.getByText(/nessun metodo di pagamento salvato/i)).toBeInTheDocument();
  });

  test('elimina solo dopo la conferma, con l id del metodo', async () => {
    const onDelete = vi.fn();
    render(<PaymentMethodList methods={[CARD]} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: /elimina/i }));
    fireEvent.click(screen.getByRole('button', { name: /sì/i }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('p1'));
  });
});
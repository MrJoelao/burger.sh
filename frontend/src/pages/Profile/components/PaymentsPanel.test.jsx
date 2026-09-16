import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { PaymentsPanel } from './PaymentsPanel.jsx';
import { paymentService } from '../../../services/paymentService.js';

vi.mock('../../../services/paymentService.js', () => ({
  paymentService: { list: vi.fn(), create: vi.fn(), remove: vi.fn() }
}));

const CARD = { _id: 'p1', type: 'card', label: 'Carta di Mario Rossi', details: '4242', isDefault: true };

describe('PaymentsPanel', () => {
  beforeEach(() => vi.clearAllMocks());

  test('elenca le carte salvate mostrando solo le ultime quattro cifre', async () => {
    paymentService.list.mockResolvedValue({ success: true, data: [CARD] });

    render(<PaymentsPanel active />);

    expect(await screen.findByText('•••• 4242')).toBeInTheDocument();
    expect(screen.getByText('Carta di Mario Rossi')).toBeInTheDocument();
  });

  test('non propone i contanti tra i metodi da salvare', async () => {
    paymentService.list.mockResolvedValue({ success: true, data: [] });

    render(<PaymentsPanel active />);
    await screen.findByText(/nessun metodo/i);

    const options = screen.getAllByRole('option').map(option => option.textContent);
    expect(options).not.toContain('contanti');
  });

  test('salva una nuova carta con le sole ultime quattro cifre', async () => {
    paymentService.list.mockResolvedValue({ success: true, data: [] });
    paymentService.create.mockResolvedValue({ success: true, data: CARD });

    render(<PaymentsPanel active />);
    await screen.findByText(/nessun metodo/i);

    fireEvent.input(screen.getByLabelText('nome intestatario'), { target: { value: 'Mario' } });
    fireEvent.input(screen.getByLabelText('cognome intestatario'), { target: { value: 'Rossi' } });
    fireEvent.input(screen.getByLabelText('numero carta'), { target: { value: '4242 4242 4242 4242' } });
    fireEvent.input(screen.getByLabelText('scadenza'), { target: { value: '12/29' } });
    fireEvent.input(screen.getByLabelText('cvv'), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /aggiungi/i }));

    await waitFor(() => {
      expect(paymentService.create).toHaveBeenCalledWith({
        type: 'card',
        label: 'Carta di Mario Rossi',
        details: '4242',
        isDefault: false
      });
    });
  });

  test('elimina una carta solo dopo la conferma', async () => {
    paymentService.list.mockResolvedValue({ success: true, data: [CARD] });
    paymentService.remove.mockResolvedValue({ success: true });

    render(<PaymentsPanel active />);
    fireEvent.click(await screen.findByRole('button', { name: /elimina/i }));
    fireEvent.click(screen.getByRole('button', { name: /sì/i }));

    await waitFor(() => expect(paymentService.remove).toHaveBeenCalledWith('p1'));
  });
});
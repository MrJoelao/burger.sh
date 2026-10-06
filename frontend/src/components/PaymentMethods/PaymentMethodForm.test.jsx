import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { PaymentMethodForm } from './PaymentMethodForm.jsx';

describe('PaymentMethodForm', () => {
  test('propone carta, paypal e altro come opzioni, mai contanti', () => {
    render(<PaymentMethodForm busy={false} onSubmit={() => {}} />);

    const options = screen.getAllByRole('option').map(option => option.textContent);
    expect(options).toEqual(expect.arrayContaining(['carta', 'paypal', 'altro']));
    expect(options).not.toContain('contanti');
  });

  test('le opzioni non carta spiegano che si salvano solo le carte', () => {
    render(<PaymentMethodForm busy={false} onSubmit={() => {}} />);

    fireEvent.change(screen.getByLabelText('tipo'), { target: { value: 'paypal' } });

    expect(screen.getByText(/solo le carte/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /aggiungi/i })).toBeDisabled();
  });

  test('invia solo il payload accettato dal backend con una carta valida', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<PaymentMethodForm busy={false} onSubmit={onSubmit} />);

    fireEvent.input(screen.getByLabelText('nome intestatario'), { target: { value: 'Mario' } });
    fireEvent.input(screen.getByLabelText('cognome intestatario'), { target: { value: 'Rossi' } });
    fireEvent.input(screen.getByLabelText('numero carta'), { target: { value: '4242 4242 4242 4242' } });
    fireEvent.input(screen.getByLabelText('scadenza'), { target: { value: '12/29' } });
    fireEvent.input(screen.getByLabelText('cvv'), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /aggiungi/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        type: 'card',
        label: 'Carta di Mario Rossi',
        details: '4242',
        isDefault: false
      });
    });
  });

  test('non invia una carta incompleta', async () => {
    const onSubmit = vi.fn();
    render(<PaymentMethodForm busy={false} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /aggiungi/i }));

    expect(await screen.findByText(/numero carta non valido/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
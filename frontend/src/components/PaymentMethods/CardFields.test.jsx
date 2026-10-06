import { render, screen } from '@testing-library/preact';
import { CardFields } from './CardFields.jsx';

describe('CardFields', () => {
  test('chiede tutti i dati di una carta', () => {
    render(<CardFields values={{}} errors={{}} onChange={() => {}} />);

    expect(screen.getByLabelText('nome intestatario')).toBeInTheDocument();
    expect(screen.getByLabelText('cognome intestatario')).toBeInTheDocument();
    expect(screen.getByLabelText('numero carta')).toBeInTheDocument();
    expect(screen.getByLabelText('scadenza')).toBeInTheDocument();
    expect(screen.getByLabelText('cvv')).toBeInTheDocument();
  });

  test('mostra gli errori di validazione per campo', () => {
    render(<CardFields values={{}} errors={{ number: 'numero carta non valido' }} onChange={() => {}} />);

    expect(screen.getByText('numero carta non valido')).toBeInTheDocument();
  });
});
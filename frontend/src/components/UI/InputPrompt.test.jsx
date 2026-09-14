/**
 * InputPrompt Component Tests
 */

import { render, screen, fireEvent, act } from '@testing-library/preact';
import { InputPrompt } from './InputPrompt.jsx';

describe('InputPrompt', () => {
  test('renders with $ prefix', () => {
    render(<InputPrompt onSubmit={vi.fn()} />);
    expect(screen.getByText('$')).toBeInTheDocument();
  });

  test('shows placeholder', () => {
    render(<InputPrompt onSubmit={vi.fn()} placeholder="test command" />);
    expect(screen.getByPlaceholderText('test command')).toBeInTheDocument();
  });

  test('calls onSubmit with valid input', async () => {
    const onSubmit = vi.fn();
    render(<InputPrompt onSubmit={onSubmit} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test command' } });
    fireEvent.click(screen.getByText('▶'));
    expect(onSubmit).toHaveBeenCalledWith({ command: 'test command' });
  });

  test('shows error for empty input', async () => {
    const onSubmit = vi.fn();
    render(<InputPrompt onSubmit={onSubmit} />);
    const form = screen.getByRole('search');
    await act(async () => {
      fireEvent.submit(form);
    });
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/cannot be empty/i);
  });

  test('clears input after successful submit', async () => {
    const onSubmit = vi.fn();
    render(<InputPrompt onSubmit={onSubmit} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'valid command' } });
    fireEvent.click(screen.getByText('▶'));
    expect(input).toHaveValue('');
  });
});
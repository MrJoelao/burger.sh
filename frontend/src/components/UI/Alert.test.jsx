/**
 * Alert Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/preact';
import { Alert } from './Alert.jsx';

describe('Alert', () => {
  test('renders error variant', () => {
    render(<Alert type="error" message="Something went wrong" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('alert')).toHaveClass('bg-alert');
  });

  test('renders success variant', () => {
    render(<Alert type="success" message="Success!" />);
    expect(screen.getByRole('alert')).toHaveClass('bg-acid');
  });

  test('renders info variant', () => {
    render(<Alert type="info" message="Info" />);
    expect(screen.getByRole('alert')).toHaveClass('bg-amber');
  });

  test('shows close button when onClose provided', () => {
    render(<Alert message="Test" onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  test('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<Alert message="Test" onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
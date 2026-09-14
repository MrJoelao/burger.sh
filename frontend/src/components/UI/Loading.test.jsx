/**
 * Loading Component Tests
 */

import { render, screen } from '@testing-library/preact';
import { Loading } from './Loading.jsx';

describe('Loading', () => {
  test('renders with default size', () => {
    render(<Loading />);
    expect(screen.getByRole('status')).toHaveTextContent('| / |');
    expect(screen.getByRole('status')).toHaveClass('text-base');
  });

  test('renders with small size', () => {
    render(<Loading size="sm" />);
    expect(screen.getByRole('status')).toHaveClass('text-sm');
  });

  test('renders with large size', () => {
    render(<Loading size="lg" />);
    expect(screen.getByRole('status')).toHaveClass('text-lg');
  });

  test('has correct aria attributes', () => {
    render(<Loading />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  test('applies custom className', () => {
    render(<Loading className="custom-loading" />);
    expect(screen.getByRole('status')).toHaveClass('custom-loading');
  });
});
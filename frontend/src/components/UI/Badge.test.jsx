/**
 * Badge Component Tests
 */

import { render, screen } from '@testing-library/preact';
import { Badge } from './Badge.jsx';

describe('Badge', () => {
  test('renders with correct variant classes', () => {
    render(<Badge variant="success">Success</Badge>);
    expect(screen.getByText('Success')).toHaveClass('bg-acid');
    expect(screen.getByText('Success')).toHaveClass('text-ink');
  });

  test('renders error variant', () => {
    render(<Badge variant="error">Error</Badge>);
    expect(screen.getByText('Error')).toHaveClass('bg-alert');
    expect(screen.getByText('Error')).toHaveClass('text-white');
  });

  test('has correct role and aria-live', () => {
    render(<Badge>Info</Badge>);
    expect(screen.getByText('Info')).toHaveAttribute('role', 'status');
    expect(screen.getByText('Info')).toHaveAttribute('aria-live', 'polite');
  });

  test('applies custom className', () => {
    render(<Badge className="custom-badge">Test</Badge>);
    expect(screen.getByText('Test')).toHaveClass('custom-badge');
  });
});
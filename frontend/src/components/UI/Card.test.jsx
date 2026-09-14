/**
 * Card Component Tests
 */

import { render, screen } from '@testing-library/preact';
import { Card } from './Card.jsx';

describe('Card', () => {
  test('renders with header and children', () => {
    render(<Card header="Test Header">Card Content</Card>);
    expect(screen.getByText('Test Header')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  test('renders footer when provided', () => {
    render(<Card footer="Footer Content">Content</Card>);
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });

  test('has correct role attribute', () => {
    render(<Card header="Test">Content</Card>);
    const card = screen.getByRole('region');
    expect(card).toHaveAttribute('aria-label', 'Test');
  });

  test('applies custom className', () => {
    render(<Card className="custom-class">Content</Card>);
    expect(screen.getByRole('region')).toHaveClass('custom-class');
  });
});
/**
 * Navbar Component Tests
 */

import { render, screen } from '@testing-library/preact';
import { Navbar } from './Navbar.jsx';

describe('Navbar', () => {
  const links = [
    { to: '/', label: 'Home' },
    { to: '/menu', label: 'Menu' },
    { to: '/auth', label: 'Auth' },
  ];

  test('renders brand', () => {
    render(<Navbar brand="burger.sh" links={links} />);
    expect(screen.getByText('burger.sh')).toBeInTheDocument();
  });

  test('renders all links', () => {
    render(<Navbar links={links} />);
    links.forEach(link => {
      expect(screen.getByRole('link', { name: link.label })).toHaveAttribute('href', link.to);
    });
  });

  test('has correct role', () => {
    render(<Navbar links={links} />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  test('applies custom className', () => {
    render(<Navbar links={links} className="custom-nav" />);
    expect(screen.getByRole('navigation')).toHaveClass('custom-nav');
  });
});
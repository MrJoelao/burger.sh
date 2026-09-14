/* test del componente TitleBar */

import { render, screen, fireEvent } from '@testing-library/preact';
import { TitleBar } from './TitleBar.jsx';

const links = [
  { label: 'ordina', path: '/menu' },
  { label: 'accedi', path: '/auth' }
];

describe('TitleBar', () => {
  test('renders the brand as the only link to the home page', () => {
    render(<TitleBar section="welcome" context="production" links={links} current="/menu" />);

    const brand = screen.getByRole('link', { name: 'burger.sh' });
    expect(brand).toHaveAttribute('href', '/');

    const homeLinks = screen.getAllByRole('link').filter(link => link.getAttribute('href') === '/');
    expect(homeLinks).toHaveLength(1);
  });

  test('renders the provided links in order', () => {
    render(<TitleBar section="welcome" links={links} current="/menu" />);

    const rendered = screen.getAllByRole('link').map(link => link.textContent);
    expect(rendered).toEqual(['burger.sh', 'ordina', 'accedi']);
  });

  test('marks the current link', () => {
    render(<TitleBar section="welcome" links={links} current="/auth" />);

    expect(screen.getByRole('link', { name: 'accedi' })).toHaveClass('current');
    expect(screen.getByRole('link', { name: 'ordina' })).not.toHaveClass('current');
  });

  test('renders section and context', () => {
    render(<TitleBar section="identity gate" context="directory" links={links} current="" />);

    expect(screen.getByText(/identity gate/)).toBeInTheDocument();
    expect(screen.getByText(/directory/)).toBeInTheDocument();
  });

  test('navigates without a full reload when a link is clicked', () => {
    const pushState = vi.spyOn(window.history, 'pushState').mockImplementation(() => {});
    render(<TitleBar section="welcome" links={links} current="/menu" />);

    fireEvent.click(screen.getByRole('link', { name: 'accedi' }));

    expect(pushState).toHaveBeenCalledWith({}, '', '/auth');
    pushState.mockRestore();
  });

  test('navigates home when the brand is clicked', () => {
    const pushState = vi.spyOn(window.history, 'pushState').mockImplementation(() => {});
    render(<TitleBar section="welcome" links={links} current="/menu" />);

    fireEvent.click(screen.getByRole('link', { name: 'burger.sh' }));

    expect(pushState).toHaveBeenCalledWith({}, '', '/');
    pushState.mockRestore();
  });
});

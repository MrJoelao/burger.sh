/**
 * TerminalButton Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/preact';
import { TerminalButton } from './TerminalButton.jsx';

describe('TerminalButton', () => {
  test('renders with label in brackets', () => {
    render(<TerminalButton label="EXECUTE" />);
    expect(screen.getByRole('button')).toHaveTextContent('[ EXECUTE ]');
  });

  test('calls onClick handler', () => {
    const handleClick = vi.fn();
    render(<TerminalButton label="TEST" onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('has aria-keyshortcuts when provided', () => {
    render(<TerminalButton label="SAVE" shortcutKey="Ctrl+S" />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-keyshortcuts', 'Ctrl+S');
  });

  test('applies custom className', () => {
    render(<TerminalButton label="TEST" className="custom-btn" />);
    expect(screen.getByRole('button')).toHaveClass('custom-btn');
  });

  test('has correct focus styles', () => {
    render(<TerminalButton label="FOCUS" />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('focus:ring-2');
    expect(btn).toHaveClass('focus:ring-amber');
  });
});
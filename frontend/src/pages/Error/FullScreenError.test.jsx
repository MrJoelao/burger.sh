import { render, screen } from '@testing-library/preact';
import { FullScreenError } from './FullScreenError.jsx';

describe('FullScreenError', () => {
  test('rende la variante identità senza il guscio degli ordini', () => {
    const { container } = render(
      <FullScreenError
        statusCode={401}
        title="ACCEDI_PER PROCEDERE"
        message="Questa sezione richiede un'identità verificata."
      />
    );

    expect(screen.getByRole('heading', { name: /ACCEDI_PER PROCEDERE/i })).toBeInTheDocument();
    expect(container.querySelector('main.error-fullscreen[data-error-kind="auth"]')).not.toBeNull();
    expect(container.querySelector('.crt-noise')).not.toBeNull();
    expect(container.querySelector('.error-noise')).toBeNull();
    expect(container.querySelector('.command-list')).toBeNull();
    expect(screen.queryByText(/buffer empty/i)).toBeNull();
  });

  test('rende varianti distinte per accesso negato e percorso inesistente', () => {
    const denied = render(<FullScreenError statusCode={403} title="DENIED" />);
    expect(denied.container.querySelector('main.error-fullscreen[data-error-kind="denied"]')).not.toBeNull();
    denied.unmount();

    const missing = render(<FullScreenError statusCode={404} title="VOID" />);
    expect(missing.container.querySelector('main.error-fullscreen[data-error-kind="not-found"]')).not.toBeNull();
  });
});

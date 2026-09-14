/* la pagina di setup orchestra il servizio: recupera se serve il PIN, esegue
   il setup e mostra le credenziali provvisorie una sola volta */

import { render, screen, fireEvent } from '@testing-library/preact';
import { SetupPage } from './SetupPage.jsx';
import { setupService } from '../../services/setupService.js';

vi.mock('../../services/setupService.js', () => ({
  setupService: {
    requestPin: vi.fn(),
    executeSetup: vi.fn(),
    getStatus: vi.fn(),
    changePassword: vi.fn()
  }
}));

beforeEach(() => {
  setupService.requestPin.mockResolvedValue({ success: true, data: { pinRequired: false } });
});

async function completeWizard() {
  const form = document.querySelector('form');
  fireEvent.submit(form); // passo 0 -> 1
  fireEvent.input(await screen.findByLabelText('email'), { target: { value: 'capo@burger.sh' } });
  fireEvent.input(screen.getByLabelText('nome'), { target: { value: 'Ada' } });
  fireEvent.input(screen.getByLabelText('cognome'), { target: { value: 'Lovelace' } });
  fireEvent.submit(form); // passo 1 -> 2
  fireEvent.submit(form); // invio finale
}

describe('SetupPage', () => {
  test('renderizza il wizard nel guscio setup', async () => {
    const { container } = render(<SetupPage />);

    expect(container.querySelector('main.setup-console')).not.toBeNull();
    await screen.findByText('VERIFICA ACCESSO');
  });

  test('al primo avvio riproduce la sequenza di boot', async () => {
    const { container } = render(<SetupPage />);

    expect(container.querySelector('.setup-boot')).not.toBeNull();
    await screen.findByText('VERIFICA ACCESSO');
  });

  test('dopo il setup mostra le credenziali provvisorie', async () => {
    setupService.executeSetup.mockResolvedValue({
      success: true,
      data: { adminEmail: 'capo@burger.sh', adminPassword: 'abc123provvisoria' }
    });

    render(<SetupPage />);
    await completeWizard();

    expect(setupService.executeSetup).toHaveBeenCalledWith({
      email: 'capo@burger.sh',
      name: 'Ada',
      surname: 'Lovelace'
    });
    expect(await screen.findByText('abc123provvisoria')).toBeInTheDocument();
  });

  test('mostra lo stato di setup disabilitato in produzione', async () => {
    setupService.executeSetup.mockRejectedValue({ status: 403, message: 'forbidden' });

    render(<SetupPage />);
    await completeWizard();

    expect(await screen.findByText(/ALLOW_FIRST_RUN_SETUP/)).toBeInTheDocument();
  });
});

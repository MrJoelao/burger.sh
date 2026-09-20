import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { DebugConsole } from './DebugConsole.jsx';
import { systemService } from '../../services/systemService.js';
import { setupService } from '../../services/setupService.js';

const { logout } = vi.hoisted(() => ({ logout: vi.fn() }));

vi.mock('../../state/authStore.js', () => ({
  useAuthStore: () => ({ user: { id: 'u1', role: 'admin', email: 'root@x.it' }, logout })
}));

vi.mock('../../router/navigate.js', () => ({ navigate: vi.fn() }));

vi.mock('../../services/systemService.js', () => ({ systemService: { health: vi.fn() } }));
vi.mock('../../services/setupService.js', () => ({ setupService: { getStatus: vi.fn() } }));

/* jwt minimo con payload in base64url, per esercitare il mascheramento */
function craftToken(payload) {
  const encode = (value) => btoa(JSON.stringify(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`;
}

function openConsole() {
  fireEvent.click(screen.getByRole('button', { name: /apri console/i }));
}

describe('DebugConsole', () => {
  test('interroga backend e setup e mostra la sessione', async () => {
    localStorage.setItem('auth_token', craftToken({ id: 'u1', role: 'admin', exp: 9999999999 }));
    systemService.health.mockResolvedValue({ success: true, message: 'backend attivo' });
    setupService.getStatus.mockResolvedValue({ success: true, data: { adminExists: true, setupCompleted: true } });

    render(<DebugConsole />);
    openConsole();

    expect(await screen.findByText(/backend attivo/i)).toBeInTheDocument();
    expect(screen.getByText('root@x.it')).toBeInTheDocument();
    expect(screen.getAllByText('sì').length).toBe(2);
  });

  test('svuota lo storage locale solo dopo la conferma', async () => {
    localStorage.setItem('auth_token', craftToken({ id: 'u1', role: 'admin', exp: 9999999999 }));
    systemService.health.mockResolvedValue({ success: true, message: 'backend attivo' });
    setupService.getStatus.mockResolvedValue({ success: true, data: {} });

    render(<DebugConsole />);
    openConsole();
    await screen.findByText(/backend attivo/i);

    fireEvent.click(screen.getByRole('button', { name: /svuota storage/i }));
    fireEvent.click(screen.getByRole('button', { name: /sì/i }));

    await waitFor(() => expect(localStorage.getItem('auth_token')).toBeNull());
  });
});

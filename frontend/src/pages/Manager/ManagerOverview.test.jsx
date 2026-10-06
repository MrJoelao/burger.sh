import { render, screen } from '@testing-library/preact';
import { ManagerOverview } from './ManagerOverview.jsx';
import { managerAdminService } from '../../services/managerAdminService.js';

/* lo stato utente è mutabile: serve a coprire sia il manager approvato con una
   sede sia quello ancora in attesa, che non ne ha nessuna */
const { auth } = vi.hoisted(() => ({ auth: { user: null } }));

vi.mock('../../state/authStore.js', () => ({
  useAuthStore: () => ({ user: auth.user })
}));

vi.mock('../../router/navigate.js', () => ({ navigate: vi.fn() }));

vi.mock('../../services/managerAdminService.js', () => ({
  managerAdminService: { getDashboard: vi.fn() }
}));

const dashboard = {
  success: true,
  data: {
    ordersByStatus: { ordered: 2, delivered: 40 },
    revenue: 512.4,
    topDishes: [{ dishId: 'd1', name: 'Cheeseburger', quantitySold: 37 }]
  }
};

const approvedManager = {
  id: 'm1',
  name: 'Ada',
  surname: 'Lovelace',
  role: 'manager',
  managerStatus: 'approved',
  restaurantId: 'r1',
  restaurant: {
    _id: 'r1',
    name: 'Sede Duomo',
    city: 'Milano',
    address: 'Piazza Duomo 1',
    phone: '0212345678',
    vatNumber: 'IT1'
  }
};

describe('ManagerOverview', () => {
  test('mostra la scheda sede, la telemetria e la classifica', async () => {
    auth.user = approvedManager;
    managerAdminService.getDashboard.mockResolvedValue(dashboard);

    render(<ManagerOverview />);

    expect(await screen.findByText('Sede Duomo')).toBeInTheDocument();
    expect(screen.getByText('€ 512.40')).toBeInTheDocument();
    expect(screen.getByText('Cheeseburger')).toBeInTheDocument();
    expect(screen.getByText('37')).toBeInTheDocument();
    expect(managerAdminService.getDashboard).toHaveBeenCalledWith('r1');
  });

  test('un manager in attesa non vede la plancia e non gli si propone di aprire la sede', async () => {
    auth.user = { id: 'm2', name: 'Bob', role: 'manager', managerStatus: 'pending' };

    render(<ManagerOverview />);

    expect(await screen.findByText(/in attesa di approvazione/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /apri la tua filiale/i })).not.toBeInTheDocument();
    expect(managerAdminService.getDashboard).not.toHaveBeenCalled();
  });
});

/**
 * AppRouter - Route definitions with role-based guards
 * Built on a lightweight custom matcher (path → component map with role checks)
 */

import { html } from '../utils/htm.js';
import { useState, useEffect } from 'preact/hooks';
import { HomePage } from '../pages/Home/HomePage.jsx';
import { AuthLayout } from '../pages/Auth/AuthLayout.jsx';
import { RestaurantSelectPage } from '../pages/Order/RestaurantSelectPage.jsx';
import { OrderMenuPage } from '../pages/Order/OrderMenuPage.jsx';
import { OrderPaymentPage } from '../pages/Order/OrderPaymentPage.jsx';
import { OrderDetailPage } from '../pages/Order/OrderDetailPage.jsx';
import { CustomerDashboard } from '../pages/Dashboard/CustomerDashboard.jsx';
import { ManagerOverview } from '../pages/Manager/ManagerOverview.jsx';
import { ManagerOrders } from '../pages/Manager/ManagerOrders.jsx';
import { ManagerMenu } from '../pages/Manager/ManagerMenu.jsx';
import { ManagerIngredients } from '../pages/Manager/ManagerIngredients.jsx';
import { ManagerRestaurant } from '../pages/Manager/ManagerRestaurant.jsx';
import { AdminOverview } from '../pages/Admin/AdminOverview.jsx';
import { AdminUsers } from '../pages/Admin/AdminUsers.jsx';
import { AdminBranches } from '../pages/Admin/AdminBranches.jsx';
import { AdminStats } from '../pages/Admin/AdminStats.jsx';
import { ProfilePage } from '../pages/Profile/ProfilePage.jsx';
import { SetupPage } from '../pages/Setup/SetupPage.jsx';
import { ChangePasswordPage } from '../pages/Setup/ChangePasswordPage.jsx';
import { CreateFirstRestaurantPage } from '../pages/CreateFirstRestaurant/CreateFirstRestaurantPage.jsx';
import { FullScreenError } from '../pages/Error/FullScreenError.jsx';
import { TerminalWindow } from '../components/Layout/TerminalWindow.jsx';
import { useAuthStore } from '../state/authStore.js';
import { navigate } from './navigate.js';
import { dashboardPathFor, redirectFor } from '../domain/roles.js';
import { setupService } from '../services/setupService.js';

/**
 * Route table: ordered patterns with optional role restrictions.
 * ':param' segments are matched against the URL path.
 */
const ROUTES = [
  { path: '/', component: HomePage },
  { path: '/auth', component: AuthLayout, props: { mode: 'login' } },
  { path: '/restaurants', component: RestaurantSelectPage },
  { path: '/orders', component: RestaurantSelectPage },
  { path: '/orders/menu/:restaurantId', component: OrderMenuPage },
  { path: '/orders/payment', component: OrderPaymentPage, roles: ['customer'] },
  { path: '/orders/:orderId', component: OrderDetailPage, roles: ['customer', 'manager', 'admin'] },
  { path: '/dashboard', component: CustomerDashboard, roles: ['customer'] },
  { path: '/dashboard/manager', component: ManagerOverview, roles: ['manager'] },
  { path: '/dashboard/admin', component: AdminOverview, roles: ['admin'] },
  { path: '/profile', component: ProfilePage, roles: ['customer', 'manager', 'admin'] },
  { path: '/manager/orders', component: ManagerOrders, roles: ['manager'] },
  { path: '/manager/menu', component: ManagerMenu, roles: ['manager'] },
  { path: '/manager/ingredients', component: ManagerIngredients, roles: ['manager'] },
  { path: '/manager/restaurant', component: ManagerRestaurant, roles: ['manager'] },
  { path: '/admin/users', component: AdminUsers, roles: ['admin'] },
  { path: '/admin/branches', component: AdminBranches, roles: ['admin'] },
  { path: '/admin/stats', component: AdminStats, roles: ['admin'] },
  { path: '/setup', component: SetupPage },
  { path: '/change-password', component: ChangePasswordPage, roles: ['admin'] },
  { path: '/manager/first-restaurant', component: CreateFirstRestaurantPage }
];

/**
 * Match a path against the route table. Returns { route, params } or null.
 */
function matchRoute(pathname) {
  for (const route of ROUTES) {
    const routeParts = route.path.split('/').filter(Boolean);
    const pathParts = pathname.split('/').filter(Boolean);

    if (routeParts.length !== pathParts.length) continue;

    const params = {};
    let matched = true;

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        params[routeParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
      } else if (routeParts[i] !== pathParts[i]) {
        matched = false;
        break;
      }
    }

    if (matched) return { route, params };
  }

  return null;
}

export function AppRouter() {
  const [path, setPath] = useState(window.location.pathname);
  const [setupChecked, setSetupChecked] = useState(false);
  const { user, loading: authLoading } = useAuthStore();

  /* dove deve andare questa sessione su questo percorso, o null se va bene */
  const redirect = authLoading ? null : redirectFor(user, path);

  useEffect(() => {
    const syncPath = () => setPath(window.location.pathname);
    window.addEventListener('popstate', syncPath);
    return () => window.removeEventListener('popstate', syncPath);
  }, []);

  useEffect(() => {
    if (path === '/setup' || path === '/change-password') {
      setSetupChecked(true);
      return undefined;
    }
    let cancelled = false;
    setupService.getStatus()
      .then(response => {
        if (!cancelled && response.success && !response.data?.adminExists && !response.data?.setupCompleted) navigate('/setup');
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setSetupChecked(true); });
    return () => { cancelled = true; };
  }, [path]);

  useEffect(() => {
    if (redirect) navigate(redirect);
  }, [redirect]);

  if (!setupChecked) return html`<${TerminalWindow} title="boot" subtitle="setup status"><section class="terminal-screen" style=${{ padding: '48px', textAlign: 'center' }}>verifica configurazione...</section><//>`;

  /* l'admin resta nella sua console: se il percorso non e suo lo riporto alla
     dashboard, deciso qui in render cosi non lampeggia mai la pagina sbagliata */
  if (redirect) return html`<${TerminalWindow} title="redirect" subtitle="routing"><section class="terminal-screen" style=${{ padding: '48px', textAlign: 'center' }}>reindirizzamento...</section><//>`;

  const match = matchRoute(path);

  return html`
    <div class="route-root" key=${path}>
      <${RouteGuard}
        component=${match ? match.route.component : NotFoundPage}
        roles=${match?.route.roles}
        routeProps=${{ ...(match?.route.props || {}), ...(match?.params || {}) }}
      />
    </div>
  `;
}

function RouteGuard({ component: Component, roles, routeProps = {} }) {
  const { isAuthenticated, loading, user } = useAuthStore();

  if (loading) {
    return html`
      <${TerminalWindow} title="loading" subtitle="auth check">
        <section class="terminal-screen" style=${{ textAlign: 'center', padding: '48px' }}>
          <p class="eyebrow">verifica sessione</p>
          <p style=${{ marginTop: '12px', color: 'var(--acid)' }}>| / |</p>
        </section>
      <//>
    `;
  }

  if (Component === AuthLayout) {
    return html`<${AuthRoute} ...${routeProps} />`;
  }

  // Public route - render directly
  if (!roles) {
    return html`<${Component} ...${routeProps} />`;
  }

  function AuthRoute({ mode = 'login' }) {
  const authStore = useAuthStore();
  const { login, register, refreshUser } = authStore;
    const [currentMode, setCurrentMode] = useState(mode);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (formData) => {
      setSubmitting(true);
      setError('');

      try {
        const result = currentMode === 'login'
          ? await login(formData.email, formData.password)
          : await register(formData);

        if (!result.success) {
          setError(result.message || 'Operazione non riuscita');
          return;
        }

        // dopo il login, ricarica i dati utente per avere lo stato più recente
        // (es. restaurantId aggiornato dal backend)
        await refreshUser();

        // verifica se il manager approvato deve andare al wizard
        const currentUser = authStore.user; // letto dopo refreshUser
        if (currentUser?.role === 'manager' && currentUser?.managerStatus === 'approved' && !currentUser?.restaurantId) {
          navigate('/manager/first-restaurant');
          return;
        }

        navigate(dashboardPathFor(result.data?.user?.role));
      } catch (submissionError) {
        setError(submissionError.message || 'Operazione non riuscita');
      } finally {
        setSubmitting(false);
      }
    };

    const switchMode = () => {
      setCurrentMode((previousMode) => (
        previousMode === 'login' ? 'register' : 'login'
      ));
      setError('');
    };

    return html`
      <${AuthLayout}
        mode=${currentMode}
        onSubmit=${handleSubmit}
        onSwitchMode=${switchMode}
        error=${error}
        loading=${submitting}
      />
    `;
  }

  // Protected route without session → auth required screen
  if (!isAuthenticated) {
    return html`<${AuthRequired} />`;
  }

  // Protected route with role restriction, wrong role → access denied
  if (!roles.includes(user?.role)) {
    return html`<${FullScreenError}
      statusCode=${403}
      title="DENIED"
      subtitle="authorization error"
      message=${`Il tuo ruolo (${user?.role || 'sconosciuto'}) non consente l'accesso a questa sezione. Richiedi i permessi adeguati a un amministratore.`}
      primaryLabel="torna alla home"
      primaryAction=${() => navigate('/')}
      secondaryLabel="torna indietro"
      secondaryAction=${() => window.history.back()}
      easterEggLabel="shhh... prova a digitare \"burger\" o usa il codice konami (↑↑↓↓←→←→BA)"
    />`;
  }

  return html`<${Component} ...${routeProps} />`;
}

function AuthRequired() {
  return html`<${FullScreenError}
    statusCode=${401}
    title="ACCEDI_PER PROCEDERE"
    subtitle="identity checkpoint"
    message="Questa sezione richiede un'identità verificata. Accedi per continuare nel flusso corretto."
    primaryLabel="accedi"
    primaryAction=${() => navigate('/auth')}
    secondaryLabel="home"
    secondaryAction=${() => navigate('/')}
    easterEggLabel="il percorso resta in attesa. premi enter per autenticarti."
  />`;
}

function NotFoundPage() {
  return html`<${FullScreenError}
    statusCode=${404}
    title="VOID"
    subtitle="address not found"
    message="Questo percorso non esiste nella directory del sistema. Il file cercato è stato smarrito nel cyberspazio."
    primaryLabel="torna alla home"
    primaryAction=${() => navigate('/')}
    secondaryLabel="torna indietro"
    secondaryAction=${() => window.history.back()}
    easterEggLabel="shhh... prova a digitare \"burger\" o usa il codice konami (↑↑↓↓←→←→BA)"
  />`;
}

export default AppRouter;
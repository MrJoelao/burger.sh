/**
 * AppRouter - Route definitions with role-based guards
 * Built on a lightweight custom matcher (path → component map with role checks)
 */

import { html } from '../utils/htm.js';
import { useState, useEffect } from 'preact/hooks';
import { HomePage } from '../pages/Home/HomePage.jsx';
import { AuthLayout } from '../pages/Auth/AuthLayout.jsx';
import { MenuPage } from '../pages/Menu/MenuPage.jsx';
import { RestaurantListPage } from '../pages/Restaurants/RestaurantListPage.jsx';
import { OrderConfirmPage } from '../pages/Order/OrderConfirmPage.jsx';
import { OrderHistoryPage } from '../pages/Order/OrderHistoryPage.jsx';
import { OrderDetailPage } from '../pages/Order/OrderDetailPage.jsx';
import { CustomerDashboard } from '../pages/Dashboard/CustomerDashboard.jsx';
import { ManagerDashboard } from '../pages/Dashboard/ManagerDashboard.jsx';
import { AdminDashboard } from '../pages/Dashboard/AdminDashboard.jsx';
import { ProfilePage } from '../pages/Profile/ProfilePage.jsx';
import { SetupPage } from '../pages/Setup/SetupPage.jsx';
import { ChangePasswordPage } from '../pages/Setup/ChangePasswordPage.jsx';
import { TerminalWindow } from '../components/Layout/TerminalWindow.jsx';
import { TerminalButton } from '../components/Auth/TerminalButton.jsx';
import { useAuthStore } from '../state/authStore.js';
import { useUIStore } from '../state/uiStore.js';
import { navigate } from './navigate.js';
import { setupService } from '../services/setupService.js';

/**
 * Route table: ordered patterns with optional role restrictions.
 * ':param' segments are matched against the URL path.
 */
const ROUTES = [
  { path: '/', component: HomePage },
  { path: '/auth', component: AuthLayout, props: { mode: 'login' } },
  { path: '/menu', component: MenuPage },
  { path: '/restaurants', component: RestaurantListPage },
  { path: '/orders/confirm', component: OrderConfirmPage, roles: ['customer'] },
  { path: '/orders', component: OrderHistoryPage, roles: ['customer'] },
  { path: '/orders/:id', component: OrderDetailPage, roles: ['customer', 'manager', 'admin'] },
  { path: '/dashboard', component: CustomerDashboard, roles: ['customer'] },
  { path: '/dashboard/manager', component: ManagerDashboard, roles: ['manager'] },
  { path: '/dashboard/admin', component: AdminDashboard, roles: ['admin'] }
  ,{ path: '/profile', component: ProfilePage, roles: ['customer', 'manager', 'admin'] }
  ,{ path: '/manager/orders', component: ManagerDashboard, roles: ['manager'] }
  ,{ path: '/manager/menu', component: ManagerDashboard, roles: ['manager'] }
  ,{ path: '/admin/users', component: AdminDashboard, roles: ['admin'] }
  ,{ path: '/admin/stats', component: AdminDashboard, roles: ['admin'] }
  ,{ path: '/setup', component: SetupPage }
  ,{ path: '/change-password', component: ChangePasswordPage, roles: ['admin'] }
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
  const { user } = useAuthStore();

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
    if (user?.mustChangePassword && path !== '/change-password' && path !== '/setup') navigate('/change-password');
  }, [user?.mustChangePassword, path]);

  if (!setupChecked) return html`<${TerminalWindow} title="boot" subtitle="setup status"><section class="terminal-screen" style=${{ padding: '48px', textAlign: 'center' }}>verifica configurazione...</section><//>`;
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
  const { showToast } = useUIStore();

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
    const { login, register } = useAuthStore();
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

        navigate('/');
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
    showToast('Accesso negato: ruolo insufficiente');
    return html`
      <${TerminalWindow} title="access-denied" subtitle="403">
        <section class="terminal-screen" style=${{ textAlign: 'center', padding: '48px' }}>
          <p class="eyebrow">authorization error</p>
          <h2 style=${{ font: '42px/.9 "Archivo Black", Impact, sans-serif', letterSpacing: '-0.06em', color: 'var(--alert)', margin: '12px 0' }}>
            ACCESS_<span style=${{ color: 'var(--amber)' }}>DENIED</span>
          </h2>
          <p style=${{ color: 'var(--paper)', marginBottom: '24px' }}>
            Il tuo ruolo (${user?.role || 'sconosciuto'}) non consente l'accesso a questa sezione.
          </p>
          <${TerminalButton} primary onClick=${() => window.history.back()}>
            [ esc ] torna indietro <b>→</b>
          <//>
        </section>
      <//>
    `;
  }

  return html`<${Component} ...${routeProps} />`;
}

function AuthRequired() {
  return html`
    <${TerminalWindow} title="identity-gate" subtitle="redirect">
      <section class="terminal-screen" style=${{ textAlign: 'center', padding: '48px' }}>
        <p class="eyebrow">authentication required</p>
        <h2 style=${{ font: '38px/.9 "Archivo Black", Impact, sans-serif', letterSpacing: '-0.07em', color: 'var(--amber)', margin: '12px 0' }}>
          ACCEDI_<span style=${{ color: 'var(--acid)' }}>PER</span> PROCEDERE
        </h2>
        <p style=${{ color: 'var(--paper)', marginBottom: '24px' }}>Questa sezione richiede un'identità verificata.</p>
        <div style=${{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <${TerminalButton} primary onClick=${() => navigate('/auth')}>
            [ enter ] accedi <b>→</b>
          <//>
          <${TerminalButton} onClick=${() => navigate('/')}>
            [ esc ] home
          <//>
        </div>
      </section>
    <//>
  `;
}

function NotFoundPage() {
  return html`
    <${TerminalWindow} title="404" subtitle="not found">
      <section class="terminal-screen" style=${{ textAlign: 'center', padding: '48px' }}>
        <p class="eyebrow">address not found</p>
        <h2 style=${{ font: '48px/.8 "Archivo Black", Impact, sans-serif', letterSpacing: '-0.06em', color: 'var(--white)', margin: '12px 0' }}>
          404_<span style=${{ color: 'var(--amber)' }}>VOID</span>
        </h2>
        <p style=${{ color: 'var(--paper)', marginBottom: '24px' }}>
          Questo percorso non esiste nella directory del sistema.
        </p>
        <${TerminalButton} primary onClick=${() => navigate('/')}>
          [ enter ] torna alla home <b>→</b>
        <//>
      </section>
    <//>
  `;
}

export default AppRouter;
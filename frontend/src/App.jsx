/**
 * App - Root application component
 * Handles routing, providers, and global state
 */

import { h, render, createContext } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { html } from './utils/htm.js';
import { TerminalWindow } from './components/Layout/TerminalWindow.jsx';
import { AssemblyLayout } from './components/Layout/AssemblyLayout.jsx';
import { RecipeMatrix } from './components/Menu/RecipeMatrix.jsx';
import { BurgerScanner } from './components/Menu/BurgerScanner.jsx';
import { SelectionPanel } from './components/Order/SelectionPanel.jsx';
import { OrderBuffer } from './components/Layout/OrderBuffer.jsx';
import { Toast } from './components/UI/Toast.jsx';
import { HomePage } from './pages/Home/HomePage.jsx';
import { AuthPanel } from './components/Auth/AuthPanel.jsx';
import { TerminalButton } from './components/Auth/TerminalButton.jsx';

// Auth context for global auth state
export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we have a valid token on startup
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        try {
          const response = await fetch('/api/users/me', {
            headers: { 'Authorization': `Bearer ${storedToken}` }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setUser(data.data);
              setToken(storedToken);
            } else {
              localStorage.removeItem('auth_token');
            }
          } else {
            localStorage.removeItem('auth_token');
          }
        } catch (e) {
          localStorage.removeItem('auth_token');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (data.success) {
      setToken(data.data.token);
      setUser(data.data.user);
      localStorage.setItem('auth_token', data.data.token);
      return { success: true };
    }
    return { success: false, message: data.message };
  };

  const register = async (userData) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (data.success) {
      setToken(data.data.token);
      setUser(data.data.user);
      localStorage.setItem('auth_token', data.data.token);
      return { success: true };
    }
    return { success: false, message: data.message };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
  };

  const value = { user, token, login, register, logout, loading };

  return html`
    <${AuthContext.Provider} value=${value}>
      ${children}
    <//>
  `;
}

// Toast context for global notifications
const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toastQueue, setToastQueue] = useState([]);

  const showToast = (message, duration = 1700) => {
    const id = Date.now();
    setToastQueue(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToastQueue(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  return html`
    <${ToastContext.Provider} value={{ showToast }}>
      ${children}
      ${toastQueue.map(toast => html`
        <div class="toast show" key=${toast.id} role="status">${toast.message}</div>
      `)}
    <//>
  `;
}

// Order state context
export const OrderContext = createContext();

export function OrderProvider({ children }) {
  const [items, setItems] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState({
    code: 'B-01 / CORE',
    name: 'SMASH CLASSIC',
    description: 'Doppio smash di manzo, cheddar fuso, cipolla, cetriolini e salsa della casa.',
    price: 10.50
  });
  const [quantity, setQuantity] = useState(1);
  const [activeRecipeIndex, setActiveRecipeIndex] = useState(0);

  const recipes = [
    { code: 'B-01 / CORE', name: 'SMASH CLASSIC', description: 'Doppio smash di manzo, cheddar fuso, cipolla, cetriolini e salsa della casa.', price: 10.50 },
    { code: 'B-02 / HEAT', name: 'HOT SIGNAL', description: 'Manzo alla piastra, jalapeño, cheddar, cipolla croccante e salsa habanero.', price: 11.50 },
    { code: 'B-03 / GREEN', name: 'GREEN MACHINE', description: 'Patty vegetale, lattuga, cipolla, pomodoro e maionese al lime.', price: 9.50 },
    { code: 'B-04 / BIRD', name: 'CRISPY BIRD', description: 'Pollo fritto, cavolo marinato, lattuga e maionese affumicata.', price: 10.00 }
  ];

  const selectRecipe = (index, recipe) => {
    setActiveRecipeIndex(index);
    setSelectedRecipe(recipe);
    setQuantity(1);
  };

  const addToBuffer = () => {
    setItems(prev => [...prev, { ...selectedRecipe, quantity }]);
    // Toast will be shown via context
  };

  const clearBuffer = () => {
    setItems([]);
  };

  const formatEuro = (amount) => `€ ${amount.toFixed(2)}`;

  const value = {
    items,
    selectedRecipe,
    quantity,
    setQuantity,
    activeRecipeIndex,
    recipes,
    selectRecipe,
    addToBuffer,
    clearBuffer,
    formatEuro
  };

  return html`
    <${OrderContext.Provider} value=${value}>
      ${children}
    <//>
  `;
}

// Main Menu Page Component
function MenuPage() {
  return html`
    <${OrderProvider}>
      <${TerminalWindow} title="kitchen-ops" subtitle="production console">
        <${AssemblyLayout}>
          <${BurgerScanner} />
          <${SelectionPanel} />
        <//>
        <${RecipeMatrix} />
      <//>
    <//>
  `;
}

// Auth Page Component
function AuthPage({ navigate }) {
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data) => {
    setLoading(true);
    setError('');

    if (mode === 'login') {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password })
      });
      const result = await response.json();
      if (result.success) {
        localStorage.setItem('auth_token', result.data.token);
        navigate('/');
        return;
      }
      setError(result.message || 'Login failed');
    } else {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        localStorage.setItem('auth_token', result.data.token);
        navigate('/');
        return;
      }
      setError(result.message || 'Registration failed');
    }
    setLoading(false);
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return html`
    <div class="crt-noise" aria-hidden="true"></div>
    <main class="console access-console" aria-label="Accesso burger.sh">
      <header class="titlebar">
        <div class="window-controls" aria-hidden="true"><i></i><i></i><i></i></div>
        <p><b>burger.sh</b><span>/</span> identity gate <span>/</span> production</p>
        <nav class="top-links" aria-label="Navigazione principale">
          <a href="/">ordina</a>
          <a class="current" href="/auth">accedi</a>
        </nav>
        <div class="machine-state"><span class="pulse"></span> secure local</div>
      </header>

      <section class="access-layout">
        <aside class="access-aside">
          <a class="wordmark" href="/">BURGER<span>.SH</span></a>
          <div class="access-aside-copy">
            <p class="eyebrow">identity subsystem</p>
            <h1>IL TUO<br>POSTO<br>NELLA<br><span>CODA.</span></h1>
            <p>Accedi per salvare gli ordini, tenere d'occhio i preferiti e non riscrivere tutto ogni volta.</p>
          </div>
          <div class="access-aside-footer">
            <span>session / guest</span>
            <span>encryption / mock</span>
            <span>status / ready</span>
          </div>
        </aside>

        <${AuthPanel}
          mode=${mode}
          onSubmit=${handleSubmit}
          onSwitchMode=${switchMode}
          error=${error}
          loading=${loading}
        />
      </section>

      <footer class="footer-status">
        <span><b>tab</b> campo successivo</span>
        <span><b>enter</b> invia</span>
        <span><b>esc</b> annulla</span>
        <span class="live-command">guest@burger:~$ <i></i></span>
      </footer>
    </main>
  `;
}

// Simple router
function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (newPath) => {
    window.history.pushState({}, '', newPath);
    setPath(newPath);
  };

  // Simple route matching
  if (path === '/auth' || path === '/auth/login' || path === '/auth/register') {
    return html`<${AuthPage} navigate=${navigate} />`;
  }

  if (path === '/menu') {
    return html`
      <${AuthProvider}>
        <${ToastProvider}>
          <${MenuPage} />
        <//>
      <//>
    `;
  }

  // Default: Home page
  return html`
    <${HomePage} onNavigate=${navigate} />
  `;
}

export { App };

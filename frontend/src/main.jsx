/**
 * Main Entry Point - burger.sh Frontend
 * Initializes Preact app with global styles, providers, and error boundary
 */

import { render, h } from 'preact';
import htm from 'htm';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { AuthStoreProvider } from './state/authStore.js';
import { OrderStoreProvider } from './state/orderStore.js';
import { RestaurantStoreProvider } from './state/restaurantStore.js';
import { UIStoreProvider } from './state/uiStore.js';
import { AppRouter } from './router/AppRouter.jsx';

const html = htm.bind(h);

// Vite provides import.meta.env for environment detection
// No need for process polyfill - use import.meta.env directly
const isDev = import.meta.env.DEV;

render(
  html`
    <${ErrorBoundary}>
      <${UIStoreProvider}>
        <${AuthStoreProvider}>
          <${RestaurantStoreProvider}>
            <${OrderStoreProvider}>
              <${AppRouter} />
            <//>
          <//>
        <//>
      <//>
    <//>
  `,
  document.getElementById('app')
);
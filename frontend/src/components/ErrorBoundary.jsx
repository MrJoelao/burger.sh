/**
 * ErrorBoundary - Preact error boundary with terminal aesthetic
 * Catches render errors and shows a styled fallback screen
 */

import { Component } from 'preact';
import { html } from '../utils/htm.js';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error('error:', error);
      console.log('message:', error?.message);
      console.log('component stack:', errorInfo?.componentStack);
      console.log('route:', window.location.pathname);
      console.log('children at boundary:', this.props.children);
    }
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return html`
        <div class="crt-noise" aria-hidden="true"></div>
        <main class="console" style=${{ display: 'flex', flexDirection: 'column' }}>
          <header class="titlebar">
            <div class="window-controls" aria-hidden="true"><i></i><i></i><i></i></div>
            <p><b>burger.sh</b><span>/</span> system <span>/</span> fault</p>
            <div class="machine-state" style=${{ color: 'var(--alert)' }}>
              <span class="pulse" style=${{ background: 'var(--alert)' }}></span> kernel panic
            </div>
          </header>

          <section class="terminal-screen" style=${{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', minHeight: '60vh' }}>
            <p class="eyebrow">runtime exception</p>
            <h2 style=${{ margin: '12px 0', font: '42px/.8 "Archivo Black", Impact, sans-serif', letterSpacing: '-0.06em', color: 'var(--alert)' }}>
              SYSTEM_<span style=${{ color: 'var(--amber)' }}>FAULT</span>
            </h2>
            <p style=${{ color: 'var(--paper)', maxWidth: '480px', margin: '16px 0' }}>
              Qualcosa è andato storto durante il rendering. Nessun problema:
              il grill è ancora caldo.
            </p>
            <p style=${{ color: 'var(--dirty)', fontSize: '10px', maxWidth: '480px', overflowWrap: 'anywhere' }}>
              ${this.state.error?.message || String(this.state.error)}
            </p>
            <div style=${{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                class="terminal-button primary"
                type="button"
                onClick=${this.handleReset}
              >
                [ enter ] riprova <b>→</b>
              </button>
              <button
                class="terminal-button"
                type="button"
                onClick=${() => window.location.reload()}
              >
                [ ctrl + r ] ricarica pagina
              </button>
            </div>
          </section>

          <footer class="footer-status">
            <span><b>err</b> uncaught</span>
            <span class="live-command">guest@burger:~$ <i style=${{ background: 'var(--alert)' }}></i></span>
          </footer>
        </main>
      `;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
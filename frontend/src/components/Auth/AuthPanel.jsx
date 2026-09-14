/**
 * AuthPanel - Form container with header, form, and switch footer
 */

import { html } from '../../utils/htm.js';
import { AuthForm } from './AuthForm.jsx';

export function AuthPanel({
  mode = 'login',
  onSubmit = () => {},
  onSwitchMode = () => {},
  error = '',
  loading = false
}) {
  const config = {
    login: {
      eyebrow: 'identity gate / existing user',
      title: 'BENTORNATO.',
      subtitle: 'Inserisci le tue credenziali per continuare.',
      switchCopy: 'Nuovo qui?',
      switchLabel: 'crea un account'
    },
    register: {
      eyebrow: 'identity gate / new user',
      title: 'REGISTRAZIONE.',
      subtitle: 'Crea un profilo. Ti servirà per salvare ordini e preferiti.',
      switchCopy: 'Hai già un account?',
      switchLabel: 'accedi'
    }
  };

  const current = config[mode];

  return html`
    <section class="auth-panel">
      <header>
        <p class="eyebrow" id="auth-eyebrow">${current.eyebrow}</p>
        <h2 id="auth-title">${current.title}</h2>
        <p id="auth-subtitle">${current.subtitle}</p>
      </header>

      <${AuthForm}
        mode=${mode}
        onSubmit=${onSubmit}
        onSwitchMode=${onSwitchMode}
        error=${error}
        loading=${loading}
      />
    </section>
  `;
}

export default AuthPanel;
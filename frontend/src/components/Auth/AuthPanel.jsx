/**
 * AuthPanel - Form container with header, form, and switch footer
 */

import { html } from '../../utils/htm.js';
import { useState } from 'preact/hooks';
import { AuthForm } from './AuthForm.jsx';

export function AuthPanel({
  mode = 'login',
  onSubmit = () => {},
  onSwitchMode = () => {},
  error = '',
  loading = false,
  onStepChange = () => {}
}) {
  const [registrationStep, setRegistrationStep] = useState(0);
  const config = {
    login: {
      eyebrow: 'identity gate / existing user',
      title: 'BENTORNATO.',
      subtitle: 'Inserisci le tue credenziali per continuare.',
      switchCopy: 'Nuovo qui?',
      switchLabel: 'crea un account'
    },
    register: [
      ['identity gate / account type', 'SCEGLI IL TUO RUOLO.', 'Partiamo da come userai burger.sh.'],
      ['identity gate / profile', 'PRESENTATI.', 'Un nome rende ogni ordine riconoscibile.'],
      ['identity gate / credentials', 'METTI AL SICURO.', 'Crea le credenziali per ritrovare il tuo profilo.'],
      ['identity gate / delivery', 'DOVE TI TROVI?', 'Così prepariamo consegne e ritiri senza errori.'],
      ['identity gate / preferences', 'COSA TI VA?', 'Scegli i segnali che vuoi vedere nel menu.']
    ]
  };

  const current = mode === 'register'
    ? config.register[registrationStep]
    : config.login;
  const handleStepChange = (step, role) => {
    setRegistrationStep(step);
    onStepChange(step, role);
  };

  return html`
    <section class="auth-panel">
      <header>
        <p class="eyebrow" id="auth-eyebrow">${mode === 'register' ? current[0] : current.eyebrow}</p>
        <h2 id="auth-title">${mode === 'register' ? current[1] : current.title}</h2>
        <p id="auth-subtitle">${mode === 'register' ? current[2] : current.subtitle}</p>
      </header>

      <${AuthForm}
        mode=${mode}
        onSubmit=${onSubmit}
        onSwitchMode=${onSwitchMode}
        error=${error}
        loading=${loading}
        onStepChange=${handleStepChange}
      />
    </section>
  `;
}

export default AuthPanel;
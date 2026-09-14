/**
 * AuthForm - Login/Register form with validation
 */

import { html } from '../../utils/htm.js';
import { useState } from 'preact/hooks';
import { TerminalButton } from './TerminalButton.jsx';

export function AuthForm({
  mode = 'login', // 'login' | 'register'
  onSubmit = () => {},
  onSwitchMode = () => {},
  error = '',
  loading = false
}) {
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer',
    street: '',
    city: '',
    zip: '',
    preferences: []
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (mode === 'register') {
      if (!formData.name.trim()) newErrors.name = 'Nome richiesto';
      if (!formData.surname.trim()) newErrors.surname = 'Cognome richiesto';
      if (!formData.email.trim()) newErrors.email = 'Email richiesta';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email non valida';
      if (!formData.password) newErrors.password = 'Password richiesta';
      else if (formData.password.length < 6) newErrors.password = 'Almeno 6 caratteri';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Le password non coincidono';
      if (!formData.street.trim()) newErrors.street = 'Via richiesta';
      if (!formData.city.trim()) newErrors.city = 'Città richiesta';
      if (!formData.zip.trim()) newErrors.zip = 'CAP richiesto';
    } else {
      if (!formData.email.trim()) newErrors.email = 'Email richiesta';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email non valida';
      if (!formData.password) newErrors.password = 'Password richiesta';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const isRegister = mode === 'register';

  return html`
    <form class="auth-form" onSubmit=${handleSubmit} novalidate>
      ${isRegister && html`
        <label>
          nome
          <input
            type="text"
            autocomplete="name"
            placeholder="come ti chiami?"
            value=${formData.name}
            onInput=${(e) => handleChange('name', e.target.value)}
            required
          />
          ${errors.name && html`<p class="form-message">${errors.name}</p>`}
        </label>

        <label>
          cognome
          <input
            type="text"
            autocomplete="name"
            placeholder="cognome"
            value=${formData.surname}
            onInput=${(e) => handleChange('surname', e.target.value)}
            required
          />
          ${errors.surname && html`<p class="form-message">${errors.surname}</p>`}
        </label>
      `}

      <label>
        email
        <input
          type="email"
          autocomplete=${isRegister ? 'email' : 'email'}
          placeholder="you@example.com"
          value=${formData.email}
          onInput=${(e) => handleChange('email', e.target.value)}
          required
        />
        ${errors.email && html`<p class="form-message">${errors.email}</p>`}
      </label>

      <label>
        password
        <input
          type="password"
          autocomplete=${isRegister ? 'new-password' : 'current-password'}
          placeholder="••••••••"
          value=${formData.password}
          onInput=${(e) => handleChange('password', e.target.value)}
          minlength="6"
          required
        />
        ${errors.password && html`<p class="form-message">${errors.password}</p>`}
      </label>

      ${isRegister && html`
        <label>
          conferma password
          <input
            type="password"
            autocomplete="new-password"
            placeholder="••••••••"
            value=${formData.confirmPassword}
            onInput=${(e) => handleChange('confirmPassword', e.target.value)}
            minlength="6"
            required
          />
          ${errors.confirmPassword && html`<p class="form-message">${errors.confirmPassword}</p>`}
        </label>

        <label>
          ruolo
          <select
            value=${formData.role}
            onChange=${(e) => handleChange('role', e.target.value)}
            style=${{ width: '100%', padding: '11px', border: '1px solid var(--line)', borderRadius: '0', background: '#100e0a', color: 'var(--white)', font: '13px "IBM Plex Mono", Consolas, monospace' }}
          >
            <option value="customer">Cliente</option>
            <option value="manager">Manager (richiede approvazione Admin)</option>
          </select>
        </label>

        <label>
          via
          <input
            type="text"
            autocomplete="street-address"
            placeholder="Via Roma 1"
            value=${formData.street}
            onInput=${(e) => handleChange('street', e.target.value)}
            required
          />
          ${errors.street && html`<p class="form-message">${errors.street}</p>`}
        </label>

        <label>
          città
          <input
            type="text"
            autocomplete="address-level2"
            placeholder="Milano"
            value=${formData.city}
            onInput=${(e) => handleChange('city', e.target.value)}
            required
          />
          ${errors.city && html`<p class="form-message">${errors.city}</p>`}
        </label>

        <label>
          CAP
          <input
            type="text"
            autocomplete="postal-code"
            placeholder="20100"
            value=${formData.zip}
            onInput=${(e) => handleChange('zip', e.target.value)}
            required
          />
          ${errors.zip && html`<p class="form-message">${errors.zip}</p>`}
        </label>

        <label>
          preferenze
          <div style=${{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
            ${['vegetariano', 'vegano', 'senza_glutine', 'piccante', 'offerte_speciali', 'consegna_rapida', 'ritiro_in_sede'].map(pref => html`
              <label style=${{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--paper)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  value=${pref}
                  checked=${formData.preferences.includes(pref)}
                  onChange=${(e) => {
                    const newPrefs = e.target.checked
                      ? [...formData.preferences, pref]
                      : formData.preferences.filter(p => p !== pref);
                    handleChange('preferences', newPrefs);
                  }}
                  style=${{ accentColor: 'var(--amber)' }}
                />
                ${pref.replace(/_/g, ' ')}
              </label>
            `)}
          </div>
        </label>
      `}

      ${error && html`<p class="form-message" id=${isRegister ? 'register-message' : 'login-message'} aria-live="polite">${error}</p>`}

      <${TerminalButton} primary type="submit" disabled=${loading}>
        [ enter ] ${isRegister ? 'crea account' : 'accedi'} <b>→</b>
      <//>

      <footer class="auth-switch">
        <span id="switch-copy">${isRegister ? 'Hai già un account?' : 'Nuovo qui?'}</span>
        <button type="button" id="auth-switch" onClick=${onSwitchMode}>
          ${isRegister ? 'accedi' : 'crea un account'}
        </button>
      </footer>

      <p class="prototype-note">I dati vengono inviati in modo sicuro al backend.</p>
    </form>
  `;
}

export default AuthForm;
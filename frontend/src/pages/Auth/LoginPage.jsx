/**
 * LoginPage - Customer/Manager login form
 * Uses AuthForm component with login mode
 */

import { html } from '../../utils/htm.js';
import { AuthForm } from '../../components/Auth/AuthForm.jsx';

export function LoginPage({ onSubmit, onSwitchMode, error, loading }) {
  return html`
    <${AuthForm}
      mode="login"
      onSubmit=${onSubmit}
      onSwitchMode=${onSwitchMode}
      error=${error}
      loading=${loading}
    />
  `;
}

export default LoginPage;
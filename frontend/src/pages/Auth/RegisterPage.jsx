/**
 * RegisterPage - Customer/Manager registration form
 * Uses AuthForm component with register mode
 */

import { html } from '../../utils/htm.js';
import { AuthForm } from '../../components/Auth/AuthForm.jsx';

export function RegisterPage({ onSubmit, onSwitchMode, error, loading }) {
  return html`
    <${AuthForm}
      mode="register"
      onSubmit=${onSubmit}
      onSwitchMode=${onSwitchMode}
      error=${error}
      loading=${loading}
    />
  `;
}

export default RegisterPage;
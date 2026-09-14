import { html } from '../../utils/htm.js';
import { useEffect, useState } from 'preact/hooks';
import { TerminalWindow } from '../../components/Layout/TerminalWindow.jsx';
import { ManagerShell } from '../../components/Layout/ManagerShell.jsx';
import { AdminShell } from '../../components/Layout/AdminShell.jsx';
import { SectionHeading } from '../../components/UI/SectionHeading.jsx';
import { TerminalButton } from '../../components/Auth/TerminalButton.jsx';
import { useAuthStore } from '../../state/authStore.js';

const preferences = ['vegetariano', 'vegano', 'senza_glutine', 'piccante', 'offerte_speciali', 'consegna_rapida', 'ritiro_in_sede'];

export function ProfilePage() {
  const { user, updateProfile } = useAuthStore();
  const [form, setForm] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      name: user?.name || '',
      surname: user?.surname || '',
      email: user?.email || '',
      password: '',
      address: { street: user?.address?.street || '', city: user?.address?.city || '', zip: user?.address?.zip || '' },
      preferences: user?.preferences || []
    });
  }, [user]);

  const setField = (field, value) => setForm(previous => ({ ...previous, [field]: value }));
  const setAddress = (field, value) => setForm(previous => ({ ...previous, address: { ...previous.address, [field]: value } }));
  const togglePreference = (preference) => setField('preferences', form.preferences.includes(preference)
    ? form.preferences.filter(item => item !== preference)
    : [...form.preferences, preference]);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true); setMessage(''); setError('');
    const payload = { ...form };
    if (!payload.password) delete payload.password;
    const result = await updateProfile(payload);
    if (result.success) setMessage('Profilo aggiornato.');
    else setError(result.message || 'Impossibile aggiornare il profilo.');
    setSaving(false);
  };

  const content = html`
    <section class="terminal-screen">
      <${SectionHeading} eyebrow="identity" title="PROFILO_<span>UTENTE</span>" />
      ${message && html`<p style=${{ color: 'var(--acid)' }}>${message}</p>`}
      ${error && html`<p style=${{ color: 'var(--alert)' }}>${error}</p>`}
      <form class="profile-form" onSubmit=${save}>
        <div class="profile-grid">
          ${[['name', 'nome'], ['surname', 'cognome'], ['email', 'email'], ['password', 'nuova password']].map(([key, label]) => html`
            <label>${label}<input type=${key === 'password' ? 'password' : 'text'} value=${form[key] || ''} onInput=${event => setField(key, event.currentTarget.value)} /></label>
          `)}
          <label>via<input value=${form.address?.street || ''} onInput=${event => setAddress('street', event.currentTarget.value)} /></label>
          <label>città<input value=${form.address?.city || ''} onInput=${event => setAddress('city', event.currentTarget.value)} /></label>
          <label>cap<input value=${form.address?.zip || ''} onInput=${event => setAddress('zip', event.currentTarget.value)} /></label>
        </div>
        <fieldset><legend>preferenze</legend><div class="preference-list">
          ${preferences.map(preference => html`<label><input type="checkbox" checked=${form.preferences?.includes(preference)} onChange=${() => togglePreference(preference)} /> ${preference.replaceAll('_', ' ')}</label>`)}
        </div></fieldset>
        <div class="profile-meta"><span>ruolo: <b>${user?.role || '—'}</b></span>${user?.managerStatus && html`<span>stato manager: <b>${user.managerStatus}</b></span>`}</div>
        <${TerminalButton} primary type="submit" disabled=${saving}>${saving ? '[ ... ] salvataggio' : '[ enter ] salva profilo'}<//>
      </form>
    </section>
  `;

  if (user?.role === 'manager') return html`<${ManagerShell} title="profile">${content}<//>`;
  if (user?.role === 'admin') return html`<${AdminShell} title="profile">${content}<//>`;
  return html`<${TerminalWindow} title="profile" subtitle="identity">${content}<//>`;
}

export default ProfilePage;

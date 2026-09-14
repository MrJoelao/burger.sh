/**
 * AdminDashboard - User management and system stats
 * Shows user approvals, system stats
 */

import { html } from '../../utils/htm.js';
import { useState, useEffect } from 'preact/hooks';
import { TerminalWindow } from '../../components/Layout/TerminalWindow.jsx';
import { SectionHeading } from '../../components/UI/SectionHeading.jsx';
import { TerminalButton } from '../../components/Auth/TerminalButton.jsx';
import { useAuthStore } from '../../state/authStore.js';
import { managerAdminService } from '../../services/managerAdminService.js';
import { Loading } from '../../components/UI/Loading.jsx';

export function AdminDashboard() {
  const [pendingManagers, setPendingManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuthStore();

  const fetchPendingManagers = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/users?managerStatus=pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch pending managers');
      }

      const data = await response.json();

      if (data.success) {
        setPendingManagers(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to fetch pending managers');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingManagers();
  }, [token]);

  const handleApprove = async (userId) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ managerStatus: 'approved' })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to approve manager');
      }

      const data = await response.json();

      if (data.success) {
        setPendingManagers(prev => prev.filter(user => user.id !== userId));
      } else {
        throw new Error(data.message || 'Failed to approve manager');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return html`
    <${TerminalWindow} title="dashboard" subtitle="admin">
      <section class="terminal-screen">
        <${SectionHeading} eyebrow="admin" title="PANNELLO_<span>DI CONTROLLO</span>" />

        ${loading && html`<${Loading} message="CARICAMENTO DATI..." />`}

        ${error && html`
          <div class="alert alert-danger" style=${{ padding: '16px', border: '1px solid var(--alert)', background: 'rgba(240, 108, 69, 0.1)', color: 'var(--alert)', marginBottom: '16px' }}>
            <strong>Errore:</strong> ${error}
          </div>
        `}

        <div style=${{ border: '1px solid var(--line)', padding: '16px', background: 'var(--panel)', marginBottom: '24px' }}>
          <${SectionHeading} eyebrow="pending" title="MANAGER_<span>DA APPROVARE</span>" />
          ${pendingManagers.length > 0 ? html`
            <div style=${{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              ${pendingManagers.map(user => html`
                <article style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px dashed var(--line)' }}>
                  <div>
                    <b>${user.name}</b>
                    <small style=${{ display: 'block', color: 'var(--dirty)', fontSize: '10px' }}>${user.email}</small>
                  </div>
                  <div>
                    <${TerminalButton} onClick=${() => handleApprove(user.id)}>
                      [ enter ] approva
                    <//>
                  </div>
                </article>
              `)}
            </div>
          ` : html`
            <div style=${{ textAlign: 'center', padding: '24px', color: 'var(--dirty)' }}>
              <p><b>_</b> nessun manager in attesa di approvazione</p>
            </div>
          `}
        </div>

        <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          <!-- Additional admin stats can be added here -->
        </div>
      </section>
    <//>
  `;
}

export default AdminDashboard;
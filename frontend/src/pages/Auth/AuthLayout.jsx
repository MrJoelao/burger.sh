/**
 * AuthLayout - Access console layout with aside and auth panel
 * Used by both LoginPage and RegisterPage
 */

import { AuthPanel } from '../../components/Auth/AuthPanel.jsx';
import { TitleBar } from '../../components/Layout/TitleBar.jsx';
import { navigate } from '../../router/navigate.js';

export function AuthLayout({
  mode = 'login',
  onSubmit,
  onSwitchMode,
  error,
  loading
}) {
  return (
    <>
      <div class="crt-noise" aria-hidden="true"></div>
      <main class="console access-console" aria-label="Accesso burger.sh">
        <TitleBar section="identity gate" context="production" status="secure local" current="/auth" />

        <section class="access-layout">
          <aside class="access-aside">
            <a class="wordmark" href="/" onClick={(event) => { event.preventDefault(); navigate('/'); }}>BURGER<span>.SH</span></a>
            <div class="access-aside-copy">
              <p class="eyebrow">identity subsystem</p>
              <h1>IL TUO<br />POSTO<br />NELLA<br /><span>CODA.</span></h1>
              <p>Accedi per salvare gli ordini, tenere d'occhio i preferiti e non riscrivere tutto ogni volta.</p>
            </div>
            <div class="access-aside-footer">
              <span>session / guest</span>
              <span>encryption / mock</span>
              <span>status / ready</span>
            </div>
          </aside>

          <AuthPanel
            mode={mode}
            onSubmit={onSubmit}
            onSwitchMode={onSwitchMode}
            error={error}
            loading={loading}
          />
        </section>

        <footer class="footer-status">
          <span><b>tab</b> campo successivo</span>
          <span><b>enter</b> invia</span>
          <span><b>esc</b> annulla</span>
          <span class="live-command">guest@burger:~$ <i></i></span>
        </footer>
      </main>
    </>
  );
}

export default AuthLayout;

/**
 * AuthLayout - Access console layout with aside and auth panel
 * Used by both LoginPage and RegisterPage
 */

import { AuthPanel } from '../../components/Auth/AuthPanel.jsx';

export function AuthLayout({
  mode = 'login',
  onSubmit,
  onSwitchMode,
  error,
  loading,
  onNavigate
}) {
  return (
    <>
      <div class="crt-noise" aria-hidden="true"></div>
      <main class="console access-console" aria-label="Accesso burger.sh">
        <header class="titlebar">
          <div class="window-controls" aria-hidden="true"><i></i><i></i><i></i></div>
          <p><b>burger.sh</b><span>/</span> identity gate <span>/</span> local prototype</p>
          <nav class="top-links" aria-label="Pagine del prototipo">
            <a href="/" onClick={(event) => { event.preventDefault(); onNavigate('/'); }}>presentazione</a>
            <a class="current" href="/auth">accedi</a>
          </nav>
          <div class="machine-state"><span class="pulse"></span> secure local</div>
        </header>

        <section class="access-layout">
          <aside class="access-aside">
            <a class="wordmark" href="/" onClick={(event) => { event.preventDefault(); onNavigate('/'); }}>BURGER<span>.SH</span></a>
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

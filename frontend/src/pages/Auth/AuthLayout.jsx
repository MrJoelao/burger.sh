/**
 * AuthLayout - Access console layout with aside and auth panel
 * Used by both LoginPage and RegisterPage
 */

import { AuthPanel } from '../../components/Auth/AuthPanel.jsx';
import { TitleBar } from '../../components/Layout/TitleBar.jsx';
import { navigate } from '../../router/navigate.js';
import { useState } from 'preact/hooks';

export function AuthLayout({
  mode = 'login',
  onSubmit,
  onSwitchMode,
  error,
  loading
}) {
  const [registrationStep, setRegistrationStep] = useState(0);
  const registerAside = [
    ['identity subsystem', 'IL TUO<br />POSTO<br />NELLA<br /><span>CODA.</span>', 'Accedi per salvare gli ordini, tenere d’occhio i preferiti e non riscrivere tutto ogni volta.'],
    ['profile signal', 'FATTI<br /><span>RICONOSCERE.</span>', 'Un’identità chiara tiene insieme ordini, preferiti e la tua esperienza nella coda.'],
    ['security gate', 'TIENI<br />TUTTO<br /><span>AL SICURO.</span>', 'Le tue credenziali restano il pass per ritrovare il profilo quando vuoi.'],
    ['delivery signal', 'DOVE<br />PASSA<br /><span>LA CODA?</span>', 'Un indirizzo completo aiuta la sede a preparare consegne e ritiri correttamente.'],
    ['taste profile', 'SCEGLI<br />IL TUO<br /><span>SEGNALE.</span>', 'Le preferenze rendono il menu più vicino ai tuoi gusti, senza vincolarti.']
  ][mode === 'register' ? registrationStep : 0];

  return (
    <>
      <div class="crt-noise" aria-hidden="true"></div>
      <main class="console access-console" aria-label="Accesso burger.sh">
        <TitleBar section="identity gate" context="production" status="secure local" current="/auth" />

        <section class="access-layout">
          <aside class="access-aside">
            <a class="wordmark" href="/" onClick={(event) => { event.preventDefault(); navigate('/'); }}>BURGER<span>.SH</span></a>
            <div class="access-aside-copy">
              <p class="eyebrow">{registerAside[0]}</p>
              <h1 dangerouslySetInnerHTML={{ __html: registerAside[1] }}></h1>
              <p>{registerAside[2]}</p>
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
            onStepChange={(step) => setRegistrationStep(step)}
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

/**
 * SetupLayout - full screen shell for the first-run bootstrap
 * dedicated page: it does not reuse the order console (command list,
 * identity strip, shift bar), so setup never looks like the ordering screen
 */

import { html } from '../../utils/htm.js';
import { TitleBar } from '../../components/Layout/TitleBar.jsx';

const BOOT_LINES = [
  'burger.sh bootstrap v1',
  'mounting identity subsystem',
  'seeding menu / dishes',
  'grill interface online'
];

export function SetupLayout({
  children,
  section = 'first-run-setup',
  context = 'system bootstrap',
  status = 'awaiting bootstrap'
}) {
  return html`
    <div class="crt-noise" aria-hidden="true"></div>
    <main class="console setup-console" aria-label="Configurazione di burger.sh">
      <${TitleBar}
        section=${section}
        context=${context}
        status=${status}
        links=${[]}
        current=${window.location.pathname}
      />

      <div class="setup-boot" aria-hidden="true">
        ${BOOT_LINES.map((line) => html`<span key=${line}>${line}</span>`)}
      </div>

      <section class="setup-layout">
        ${children}
      </section>

      <footer class="footer-status">
        <span><b>tab</b> campo successivo</span>
        <span><b>enter</b> conferma</span>
        <span><b>esc</b> annulla</span>
        <span class="live-command">root@burger:~$ <i></i></span>
      </footer>
    </main>
  `;
}

export default SetupLayout;

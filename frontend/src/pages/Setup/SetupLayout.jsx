/**
 * SetupLayout - full screen shell for the first-run bootstrap
 * dedicated page: it does not reuse the order console (command list,
 * identity strip, shift bar), so setup never looks like the ordering screen
 * the boot sequence is opt-in and only the first run asks for it
 */

import { html } from '../../utils/htm.js';
import { TitleBar } from '../../components/Layout/TitleBar.jsx';

const BOOT_LINES = [
  'burger.sh bootstrap / v1.0',
  'loading kernel modules ............ ok',
  'mounting identity subsystem ....... ok',
  'attaching mongodb store ........... ok',
  'seeding menu catalogue ............ ok',
  'spinning up grill interface ....... ok',
  'arming delivery matrix ............ ok',
  'calibrating shift clock ........... ok',
  'bootstrap ready. buon appetito.'
];

export function SetupLayout({
  children,
  section = 'first-run-setup',
  context = 'system bootstrap',
  status = 'awaiting bootstrap',
  boot = false
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

      ${boot && html`
        <div class="setup-boot" aria-hidden="true">
          <div class="setup-boot-log">
            ${BOOT_LINES.map((line, index) => html`
              <span key=${line} style=${{ '--boot-index': index }}>${line}</span>
            `)}
          </div>
          <div class="setup-boot-track"><i></i></div>
        </div>
      `}

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

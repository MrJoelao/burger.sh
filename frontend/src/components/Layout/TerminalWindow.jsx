/**
 * TerminalWindow - Main console wrapper component
 * Provides the shared console shell with titlebar, identity strip and responsive grid.
 */

import { OrderBuffer } from './OrderBuffer.jsx';
import { TitleBar } from './TitleBar.jsx';

export function TerminalWindow({
  children,
  title = 'kitchen-ops',
  subtitle = 'production console',
  showClock = true,
  orderItems = [],
  onClearBuffer = () => {}
}) {
  return (
    <>
      <div class="crt-noise" aria-hidden="true"></div>
      <main class="console" aria-label="Burger.sh kitchen console">
        <TitleBar
          section={title}
          context={subtitle}
          status="grill online"
          showClock={showClock}
        />

        <section class="identity-strip">
          <div class="brand-block">
            <span class="prompt">root@burger:~$</span>
            <h1>BURGER<br /><em>.SH</em></h1>
          </div>
          <div class="system-copy">
            <p class="eyebrow">food assembly interface / 02</p>
            <p>Componi l'ordine e invialo al backend quando sei pronto.</p>
          </div>
          <div class="shift-stamp"><span>SHIFT</span><b>12:00—23:30</b><small>milano / it</small></div>
        </section>

        <div class="terminal-grid">
          <nav class="command-list" aria-label="Comandi">
            <p class="eyebrow">directory</p>
            <button class="nav-command active" type="button" data-screen="order"><kbd>01</kbd> nuovo ordine</button>
            <button class="nav-command" type="button" data-screen="menu"><kbd>02</kbd> menu completo</button>
            <button class="nav-command" type="button" data-screen="info"><kbd>03</kbd> allergeni</button>
            <button class="nav-command" type="button" data-screen="about"><kbd>04</kbd> manifesto</button>
            <div class="nav-footer"><span>tty / bgr-02</span><span>theme / amber</span><span>user / guest</span></div>
          </nav>

          <section class="workspace">
            <header class="workspace-head">
              <p id="breadcrumb">/ orders / compose</p>
              <p>record <b id="record-number">000042</b></p>
            </header>
            <div>{children}</div>
          </section>

          <OrderBuffer items={orderItems} onClear={onClearBuffer} />
        </div>

        <footer class="footer-status">
          <span><b>F1</b> help</span>
          <span><b>↑ ↓</b> browse</span>
          <span><b>enter</b> add item</span>
          <span><b>esc</b> clear</span>
          <span class="live-command">guest@burger:~$ <i></i></span>
        </footer>

        <div class="toast" id="toast" role="status"></div>
      </main>
    </>
  );
}

export default TerminalWindow;
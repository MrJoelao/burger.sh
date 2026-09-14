/**
 * TerminalWindow - Main console wrapper component
 * Provides the shared console shell with titlebar, identity strip and responsive grid.
 */

import { useState, useEffect } from 'preact/hooks';

export function TerminalWindow({ children, title = 'kitchen-ops', subtitle = 'production console', showClock = true }) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      setTime(new Intl.DateTimeFormat('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(new Date()));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div class="crt-noise" aria-hidden="true"></div>
      <main class="console" aria-label="Burger.sh kitchen console">
        <header class="titlebar">
          <div class="window-controls" aria-hidden="true"><i></i><i></i><i></i></div>
          <p><b>burger.sh</b><span>/</span> {title} <span>/</span> {subtitle}</p>
          <nav class="top-links" aria-label="Navigazione principale">
            <a href="/">ordina</a>
            <a href="/auth">accedi</a>
          </nav>
          {showClock ? (
            <div class="machine-state"><span class="pulse"></span> grill online<time id="clock">{time}</time></div>
          ) : (
            <div class="machine-state"><span class="pulse"></span> grill online</div>
          )}
        </header>

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

          <aside class="order-buffer" aria-label="Buffer ordine">
            <header>
              <p class="eyebrow">order buffer / ram</p>
              <h2>CURRENT<br />BATCH</h2>
              <span class="buffer-mark">rw</span>
            </header>
            <div class="buffer-list" id="buffer-list">
              <p class="buffer-empty"><b>_</b> buffer empty<br /><span>aggiungi una ricetta per iniziare.</span></p>
            </div>
            <footer class="buffer-total">
              <p><span>units</span><b id="item-count">00</b></p>
              <p><span>subtotal</span><strong id="cart-total">€ 0.00</strong></p>
              <button type="button" id="clear-buffer" class="terminal-button">[ esc ] clear buffer</button>
            </footer>
          </aside>
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
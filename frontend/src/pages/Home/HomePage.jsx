/**
 * HomePage - Landing/home page for burger.sh
 * Features: Hero section with animated burger, feature board, CTAs
 * Follows burger-tui-design-system with retro terminal aesthetic
 */

import { html } from '../../utils/htm.js';

export function HomePage({ onNavigate = () => {} }) {
  return html`
    <div class="crt-noise" aria-hidden="true"></div>
    <main class="console intro-console" aria-label="Burger.sh Welcome">
      <header class="titlebar">
        <div class="window-controls" aria-hidden="true"><i></i><i></i><i></i></div>
        <p><b>burger.sh</b><span>/</span> welcome <span>/</span> prototype</p>
        <nav class="top-links" aria-label="Pagine del prototipo">
          <a class="current" href="/">presentazione</a>
          <a href="/auth">accedi</a>
          <a href="/menu">ordina</a>
        </nav>
        <div class="machine-state"><span class="pulse"></span> system ready</div>
      </header>

      <section class="intro-hero">
        <div class="intro-copy">
          <h1>BURGER<span>.SH</span></h1>
          <p class="intro-lead">
            Fast food chain management system.
            Terminal-first interface. Zero fluff. Pure flavor.
          </p>
          <div class="intro-actions">
            <button class="terminal-button primary" onClick=${() => onNavigate('/auth')}>
              [ enter ] inizia ora <b>→</b>
            </button>
            <button class="terminal-button" onClick=${() => onNavigate('/menu')}>
              [ browser ] esplora menu
            </button>
          </div>
        </div>

        <div class="hero-instrument" aria-hidden="true">
          <p>[ live system monitor ]</p>
          <div class="orbital-ring ring-one"></div>
          <div class="orbital-ring ring-two"></div>
          <div class="intro-burger">
            <div class="bun top-bun"></div>
            <div class="ingredient cheese"></div>
            <div class="ingredient onion"></div>
            <div class="ingredient patty"></div>
            <div class="ingredient lettuce"></div>
            <div class="bun bottom-bun"></div>
          </div>
          <div class="measure measure-one">420px</div>
          <div class="measure measure-two">310px</div>
          <div class="measure measure-three">280g</div>
          <div class="instrument-footer">
            <span>grill / nominal</span>
            <span>temp / 180°C</span>
          </div>
        </div>
      </section>

      <section class="intro-board">
        <article>
          <h2>ORDINA</h2>
          <p>
            Scegli dalla selezione di burger signature.
            Personalizza ingredienti, quantità, note.
          </p>
        </article>
        <article class="service-panel">
          <p class="eyebrow">core services</p>
          <div><b>01</b><span>menu digitale</span></div>
          <div><b>02</b><span>carrello locale</span></div>
          <div><b>03</b><span>checkout rapido</span></div>
          <div><b>04</b><span>storico ordini</span></div>
        </article>
        <article>
          <h2>GESTISCI</h2>
          <p>
            Dashboard per clienti, manager e admin.
            Statistiche in tempo reale, approvazioni, report.
          </p>
        </article>
      </section>

      <footer class="footer-status">
        <span><b>F1</b> help</span>
        <span><b>tab</b> naviga</span>
        <span><b>enter</b> seleziona</span>
        <span class="live-command">guest@burger:~$ <i></i></span>
      </footer>
    </main>
  `;
}

export default HomePage;
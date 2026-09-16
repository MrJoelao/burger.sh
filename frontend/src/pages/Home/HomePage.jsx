/**
 * HomePage - Landing/home page for burger.sh
 */

import { html } from '../../utils/htm.js';
import { navigate } from '../../router/navigate.js';
import { TitleBar } from '../../components/Layout/TitleBar.jsx';

export function HomePage() {
  return html`
    <div class="crt-noise" aria-hidden="true"></div>
    <main class="console intro-console" aria-label="Burger.sh Welcome">
      <${TitleBar} section="welcome" context="production" status="system ready" current="/" />

      <section class="intro-hero">
        <div class="intro-copy">
          <p class="eyebrow">node / milano centro · 12:00—23:30</p>
          <h1>HAMBURGER<br />PER CHI<br /><span>ODIA I FRONZOLI.</span></h1>
          <p class="intro-lead">Carne, piastra, pane. Il resto ha bisogno di una buona ragione per stare nel burger.</p>
          <div class="intro-actions">
            <button class="terminal-button primary" onClick=${() => navigate('/orders')}>
              [ enter ] apri il menu <b>→</b>
            </button>
            <button class="terminal-button" onClick=${() => navigate('/auth')}>
              accedi al terminale
            </button>
          </div>
        </div>

        <div class="hero-instrument" aria-label="Diagramma di composizione burger">
          <p>[ assembly signal / live ]</p>
          <div class="orbital-ring ring-one"></div>
          <div class="orbital-ring ring-two"></div>
          <div class="intro-burger" aria-hidden="true">
            <div class="bun top-bun"></div>
            <div class="ingredient cheese"></div>
            <div class="ingredient onion"></div>
            <div class="ingredient patty"></div>
            <div class="ingredient lettuce"></div>
            <div class="bun bottom-bun"></div>
          </div>
          <div class="measure measure-one">160g / manzo</div>
          <div class="measure measure-two">maillard: on</div>
          <div class="measure measure-three">build / 04</div>
          <div class="instrument-footer">
            <span>temp 212°</span>
            <span>press 7 sec</span>
            <span>ready</span>
          </div>
        </div>
      </section>

      <footer class="footer-status">
        <span><b>F1</b> info</span>
        <span><b>tab</b> seleziona</span>
        <span><b>enter</b> apri menu</span>
        <span class="live-command">guest@burger:~$ <i></i></span>
      </footer>
    </main>
  `;
}

export default HomePage;
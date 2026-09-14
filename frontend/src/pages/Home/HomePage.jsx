/**
 * HomePage - Landing/home page for burger.sh
 * Features: Hero section with animated burger, feature board, CTAs
 * Follows burger-tui-design-system with retro terminal aesthetic
 */

import { html } from '../../utils/htm.js';
import { useEffect, useState } from 'preact/hooks';
import { navigate } from '../../router/navigate.js';
import { TitleBar } from '../../components/Layout/TitleBar.jsx';
import { api } from '../../services/api.js';
import { restaurantService } from '../../services/restaurantService.js';

export function HomePage() {
  const [system, setSystem] = useState({ status: 'checking', restaurants: 0, dishes: 0 });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get('/health'),
      restaurantService.getRestaurants({ limit: 1 }),
      restaurantService.getDishes({ limit: 1 })
    ])
      .then(([health, restaurants, dishes]) => {
        if (!cancelled) {
          setSystem({
            status: health.success ? 'online' : 'offline',
            restaurants: restaurants.pagination?.total ?? restaurants.data?.length ?? 0,
            dishes: dishes.pagination?.total ?? dishes.data?.length ?? 0
          });
        }
      })
      .catch(() => {
        if (!cancelled) setSystem((current) => ({ ...current, status: 'offline' }));
      });
    return () => { cancelled = true; };
  }, []);

  return html`
    <div class="crt-noise" aria-hidden="true"></div>
    <main class="console intro-console" aria-label="Burger.sh Welcome">
      <${TitleBar} section="welcome" context="production" status="system ready" current="/" />

      <section class="intro-hero">
        <div class="intro-copy">
          <h1>BURGER<span>.SH</span></h1>
          <p class="intro-lead">
            Fast food chain management system.
            Terminal-first interface. Zero fluff. Pure flavor.
          </p>
          <div class="intro-actions">
            <button class="terminal-button primary" onClick=${() => navigate('/auth')}>
              [ enter ] inizia ora <b>→</b>
            </button>
            <button class="terminal-button" onClick=${() => navigate('/menu')}>
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

      <section class="home-live" aria-label="Stato live del sistema">
        <div>
          <p class="eyebrow">backend monitor</p>
          <h2>SYSTEM_<span>${system.status.toUpperCase()}</span></h2>
          <p>${system.status === 'offline' ? 'Il backend non risponde. Puoi tornare più tardi.' : 'Il servizio risponde e i dati sono disponibili.'}</p>
        </div>
        <div class="home-metrics">
          <div><b>${system.restaurants}</b><span>filiali</span></div>
          <div><b>${system.dishes}</b><span>piatti</span></div>
        </div>
      </section>

      <section class="home-steps" aria-label="Come funziona un ordine">
        <p class="eyebrow">order protocol</p>
        <div class="home-step-grid">
          <article><b>01</b><h3>SCEGLI</h3><p>Seleziona la filiale più comoda.</p></article>
          <article><b>02</b><h3>COMPONI</h3><p>Scegli i piatti e la quantità.</p></article>
          <article><b>03</b><h3>CONFERMA</h3><p>Controlla il buffer e invia l'ordine.</p></article>
        </div>
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
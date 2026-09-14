/**
 * StaticScreens - Read-only screens for menu complete, allergens, manifesto
 * Provides the read-only informational views for the menu.
 */

import { html } from '../../utils/htm.js';
import { SectionHeading } from '../../components/UI/SectionHeading.jsx';

const staticScreens = {
  menu: {
    breadcrumb: '/ menu / complete',
    title: 'MENU_<span>COMPLETE</span>',
    content: `
      <p>SMASH CLASSIC <b>€ 10.50</b></p>
      <p>HOT SIGNAL <b>€ 11.50</b></p>
      <p>GREEN MACHINE <b>€ 9.50</b></p>
      <p>CRISPY BIRD <b>€ 10.00</b></p>
      <small>tutti i prezzi sono di prova.</small>
    `
  },
  info: {
    breadcrumb: '/ system / allergens',
    title: 'ALLERGEN_<span>NOTICE</span>',
    content: `
      <p>GLUTINE <b>pane, pollo fritto</b></p>
      <p>LATTICINI <b>cheddar, salse</b></p>
      <p>UOVA <b>maionese</b></p>
      <small>verifica sempre con il personale prima di ordinare.</small>
    `
  },
  about: {
    breadcrumb: '/ burger.sh / manifesto',
    title: 'NO_<span>FRILLS</span>',
    content: `
      <p>CARNE. PIASTRA. PANE.</p>
      <p>Ordini chiari, ingredienti dichiarati, burger preparati al momento.</p>
      <small>interfaccia operativa collegata ai servizi burger.sh.</small>
    `
  }
};

export function StaticScreens({ screen = 'menu' }) {
  const details = staticScreens[screen] || staticScreens.menu;

  return html`
    <section class="terminal-screen" id="screen-static" aria-live="polite">
      <${SectionHeading} eyebrow="read only" title=${details.title} />
      <div class="static-content" id="static-content" dangerouslySetInnerHTML=${{ __html: details.content }} />
    </section>
  `;
}

// Export individual screen components for routing
export function MenuCompleteScreen() {
  return html`<${StaticScreens} screen="menu" />`;
}

export function AllergensScreen() {
  return html`<${StaticScreens} screen="info" />`;
}

export function ManifestoScreen() {
  return html`<${StaticScreens} screen="about" />`;
}

export default StaticScreens;
/*
 * TitleBar - shared console title bar
 * renders window controls, a clickable brand, the section context,
 * configurable navigation links and the machine status
 */

import { useEffect, useState } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { navigate } from '../../router/navigate.js';

export const DEFAULT_NAV_LINKS = [
  { label: 'ordina', path: '/menu' },
  { label: 'accedi', path: '/auth' }
];

export function TitleBar({
  section,
  context = 'production',
  status = 'system ready',
  links = DEFAULT_NAV_LINKS,
  current = window.location.pathname,
  showClock = false
}) {
  return html`
    <header class="titlebar">
      <div class="window-controls" aria-hidden="true"><i></i><i></i><i></i></div>
      <p>
        <a class="titlebar-brand" href="/" onClick=${goHome}><b>burger.sh</b></a>
        <span>/</span> ${section} <span>/</span> ${context}
      </p>
      <nav class="top-links" aria-label="Navigazione principale">
        ${links.map(link => html`
          <a
            key=${link.path}
            class=${link.path === current ? 'current' : ''}
            href=${link.path}
            onClick=${(event) => goTo(event, link.path)}
          >${link.label}</a>
        `)}
      </nav>
      <div class="machine-state">
        <span class="pulse"></span> ${status}
        ${showClock && html`<${Clock} />`}
      </div>
    </header>
  `;
}

function goHome(event) {
  event.preventDefault();
  navigate('/');
}

function goTo(event, path) {
  event.preventDefault();
  navigate(path);
}

function Clock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => setTime(formatClock(new Date()));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return html`<time id="clock">${time}</time>`;
}

function formatClock(date) {
  return new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
}

export default TitleBar;

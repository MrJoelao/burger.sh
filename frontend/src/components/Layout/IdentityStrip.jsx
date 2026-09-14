/**
 * IdentityStrip - Branding area with brand block, system copy, and shift stamp
 */

import { html } from '../../utils/htm.js';

export function IdentityStrip({
  prompt = 'root@burger:~$',
  brandName = 'BURGER',
  brandSuffix = '.SH',
  systemTagline = 'food assembly interface / 02',
  systemDescription = 'Componi l\'ordine. Il buffer resta locale, non viene inviato al backend.',
  shiftLabel = 'SHIFT',
  shiftTime = '12:00—23:30',
  shiftLocation = 'milano / it'
}) {
  return html`
    <section class="identity-strip">
      <div class="brand-block">
        <span class="prompt">${prompt}</span>
        <h1>${brandName}<br><em>${brandSuffix}</em></h1>
      </div>
      <div class="system-copy">
        <p class="eyebrow">${systemTagline}</p>
        <p>${systemDescription}</p>
      </div>
      <div class="shift-stamp"><span>${shiftLabel}</span><b>${shiftTime}</b><small>${shiftLocation}</small></div>
    </section>
  `;
}

export default IdentityStrip;
/**
 * Panel - contenitore di una sezione del profilo: intestazione con eyebrow e
 * titolo, corpo con il contenuto. È anche il tabpanel della sezione, quindi
 * sa se è quello attivo e si nasconde quando non lo è (senza smontarsi, così
 * i campi non perdono quello che l'utente ha scritto).
 */

import { html } from '../../../utils/htm.js';
import { SectionHeading } from '../../../components/UI/SectionHeading.jsx';

export function Panel({ id, eyebrow, title, titleSpan = '', active = true, children }) {
  return html`
    <section
      class="profile-panel"
      id=${`panel-${id}`}
      role="tabpanel"
      aria-labelledby=${`tab-${id}`}
      hidden=${!active}
    >
      <${SectionHeading} eyebrow=${eyebrow} title=${title} titleSpan=${titleSpan} />
      <div class="profile-panel-body">${children}</div>
    </section>
  `;
}

export default Panel;

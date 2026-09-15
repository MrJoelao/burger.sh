/**
 * Panel - contenitore di una sezione del profilo: intestazione con eyebrow e
 * titolo, corpo con il contenuto. Tiene la pagina libera dal markup ripetuto.
 */

import { html } from '../../../utils/htm.js';
import { SectionHeading } from '../../../components/UI/SectionHeading.jsx';

export function Panel({ id, eyebrow, title, titleSpan = '', children }) {
  return html`
    <section class="profile-panel" id=${id}>
      <${SectionHeading} eyebrow=${eyebrow} title=${title} titleSpan=${titleSpan} />
      <div class="profile-panel-body">${children}</div>
    </section>
  `;
}

export default Panel;

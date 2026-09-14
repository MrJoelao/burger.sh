/**
 * NavFooter - Status info footer in command list
 * Shows tty, theme, user info
 */

import { html } from '../../utils/htm.js';

export function NavFooter({
  tty = 'bgr-02',
  theme = 'amber',
  user = 'guest'
}) {
  return html`
    <div class="nav-footer">
      <span>tty / ${tty}</span>
      <span>theme / ${theme}</span>
      <span>user / ${user}</span>
    </div>
  `;
}

export default NavFooter;
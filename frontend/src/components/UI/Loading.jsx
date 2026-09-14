/**
 * Loading - ASCII-style spinner with optional size
 */

import { html } from '../../utils/htm.js';

const sizeMap = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' };

export function Loading({ size = 'md', className = '' }) {
  return html`
    <div class="animate-pulse text-amber ${sizeMap[size]} ${className}" role="status" aria-live="polite">
      | / |
    </div>
  `;
}

export default Loading;
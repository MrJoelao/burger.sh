/**
 * Shared HTM configuration
 * Preact's h function bound to htm for JSX-like template literals
 */

import { h } from 'preact';
import htm from 'htm';

export const html = htm.bind(h);
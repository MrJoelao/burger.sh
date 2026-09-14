/**
 * AsyncBoundary - rende lo stato di caricamento o di errore al posto del
 * contenuto, così ogni pagina non ripete la stessa coppia loading/error.
 */

import { html } from '../../../utils/htm.js';
import { Loading } from '../../../components/UI/Loading.jsx';

export function AsyncBoundary({ loading, error, label = 'dati', children }) {
  if (loading) return html`<${Loading} message=${`caricamento ${label}...`} />`;
  if (error) return html`<div class="alert alert-danger" role="alert"><strong>errore:</strong> ${error}</div>`;

  return children;
}

export default AsyncBoundary;

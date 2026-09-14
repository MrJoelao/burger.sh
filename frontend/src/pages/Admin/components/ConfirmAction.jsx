/**
 * ConfirmAction - bottone a due passi per le azioni distruttive. Il primo clic
 * chiede conferma, il secondo esegue: niente window.confirm, così il flusso
 * resta testabile e coerente con il resto della console.
 */

import { useState } from 'preact/hooks';
import { html } from '../../../utils/htm.js';
import { TerminalButton } from '../../../components/Auth/TerminalButton.jsx';

export function ConfirmAction({
  label,
  confirmLabel = 'confermi?',
  onConfirm,
  disabled = false
}) {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return html`
      <${TerminalButton} className="compact" disabled=${disabled} onClick=${() => setArmed(true)}>${label}<//>
    `;
  }

  return html`
    <span class="confirm-action">
      <span class="confirm-prompt">${confirmLabel}</span>
      <${TerminalButton} className="compact" primary disabled=${disabled} onClick=${() => { setArmed(false); onConfirm(); }}>[ sì ]<//>
      <${TerminalButton} className="compact" disabled=${disabled} onClick=${() => setArmed(false)}>[ no ]<//>
    </span>
  `;
}

export default ConfirmAction;

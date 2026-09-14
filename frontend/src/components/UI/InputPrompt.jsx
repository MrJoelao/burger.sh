/**
 * InputPrompt - Terminal-style input with $ prefix
 * Validates with Zod schema
 */

import { html } from '../../utils/htm.js';
import { useState } from 'preact/hooks';
import { z } from 'zod';

const commandSchema = z.object({
  command: z.string().min(1, { message: 'Command cannot be empty' }),
});

export function InputPrompt({ onSubmit, placeholder = 'type a command…', className = '' }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setValue(e.target.value);
    if (error) setError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = commandSchema.safeParse({ command: value });
    if (result.success) {
      onSubmit(result.data);
      setValue('');
    } else {
      setError(result.error.issues[0].message);
    }
  };

  return html`
    <form onSubmit=${handleSubmit} class="flex items-center ${className}" role="search">
      <span class="text-amber mr-2" aria-hidden="true">$</span>
      <input
        type="text"
        value=${value}
        onChange=${handleChange}
        placeholder=${placeholder}
        class="flex-1 bg-ink text-white border-b border-line focus:outline-none focus:border-amber"
        aria-label="Command input"
        aria-invalid=${!!error}
        required
      />
      <button type="submit" class="ml-2 text-amber hover:text-ink hover:bg-amber rounded py-0.5 px-2 focus:outline-none focus:ring-2 focus:ring-amber">
        ▶
      </button>
      ${error ? html`<div role="alert" class="mt-1 text-alert">${error}</div>` : html`<span></span>`}
    </form>
  `;
}

export default InputPrompt;
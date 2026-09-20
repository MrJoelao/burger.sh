import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { useResource, useAction } from './useResource.js';
import { html } from '../utils/htm.js';
import { useState } from 'preact/hooks';

function ResourceProbe({ loader }) {
  const resource = useResource(loader);

  return html`
    <p>${resource.loading ? 'loading' : 'ready'}</p>
    <p>${resource.error || 'no-error'}</p>
    <p data-testid="value">${resource.response?.value ?? ''}</p>
  `;
}

function ActionProbe() {
  const action = useAction();
  const [result, setResult] = useState('niente');

  return html`
    <button onClick=${async () => setResult(await action.run('x', async () => 'valore'))}>esegui</button>
    <p>${action.busyId || 'idle'}</p>
    <p>${action.actionError || 'no-error'}</p>
    <p>${result}</p>
  `;
}

describe('useResource', () => {
  test('espone il valore caricato', async () => {
    render(html`<${ResourceProbe} loader=${async () => ({ value: 'ciao' })} />`);

    await waitFor(() => expect(screen.getByTestId('value')).toHaveTextContent('ciao'));
  });

  test('espone il messaggio di errore mantenendo il valore vuoto', async () => {
    render(html`<${ResourceProbe} loader=${async () => { throw new Error('ko'); }} />`);

    expect(await screen.findByText('ko')).toBeInTheDocument();
  });
});

describe('useAction', () => {
  test('restituisce il valore del task e libera il busy', async () => {
    render(html`<${ActionProbe} />`);

    fireEvent.click(screen.getByRole('button', { name: 'esegui' }));

    expect(await screen.findByText('valore')).toBeInTheDocument();
    expect(screen.getByText('idle')).toBeInTheDocument();
  });
});

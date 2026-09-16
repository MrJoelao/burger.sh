import { render, screen } from '@testing-library/preact';
import { WizardSteps, ORDER_WIZARD_STEPS } from './WizardSteps.jsx';

describe('WizardSteps', () => {
  test('propone i tre passi del flusso d ordine', () => {
    render(<WizardSteps current="restaurant" />);

    const steps = screen.getAllByRole('listitem').map(item => item.textContent);
    expect(steps).toEqual([
      expect.stringContaining('filiale'),
      expect.stringContaining('menu'),
      expect.stringContaining('pagamento')
    ]);
    expect(ORDER_WIZARD_STEPS.map(step => step.id)).toEqual(['restaurant', 'menu', 'payment']);
  });

  test('marca il passo corrente', () => {
    render(<WizardSteps current="menu" />);

    const current = screen.getByRole('listitem', { current: 'step' });
    expect(current.textContent).toContain('menu');
  });
});
/**
 * CreateFirstRestaurantPage - pagina per la creazione del primo ristorante
 * viene mostrata ai manager approvati che non hanno ancora un ristorante
 * usa il layout SetupLayout per un'esperienza full-screen
 */

import { useState, useEffect } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { SetupLayout } from '../Setup/SetupLayout.jsx';
import { CreateFirstRestaurantWizard } from './CreateFirstRestaurantWizard.jsx';
import { restaurantService } from '../../services/restaurantService.js';
import { useAuthStore } from '../../state/authStore.js';
import { navigate } from '../../router/navigate.js';
import { dashboardPathFor } from '../../domain/roles.js';

export function CreateFirstRestaurantPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Verifica che l'utente sia un manager approvato senza ristorante
    if (!isAuthenticated || user?.role !== 'manager' || user?.managerStatus !== 'approved') {
      navigate(dashboardPathFor(user?.role));
      return;
    }

    if (user?.restaurantId) {
      // Il manager ha già un ristorante, redirect alla dashboard
      navigate('/dashboard/manager');
    }
  }, [isAuthenticated, user]);

  const handleSubmit = async (payload) => {
    setLoading(true);
    setError('');

    try {
      const result = await restaurantService.createFirstRestaurant(payload);

      if (!result.success) {
        setError(result.message || 'Errore nella creazione del ristorante');
        return;
      }

      // Se è stato aggiunto un piatto custom, crealo separatamente
      if (payload.dish) {
        const dishResult = await restaurantService.createDish(result.data._id, payload.dish);
        if (!dishResult.success) {
          console.error('Errore nella creazione del piatto:', dishResult.message);
          // Non blocchiamo il flusso principale
        }
      }

      setStep(3); // Vai alla schermata di congratulazioni
    } catch (submissionError) {
      setError(submissionError.message || 'Errore nella creazione del ristorante');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipDish = () => {
    setStep(3);
  };

  if (!isAuthenticated || user?.role !== 'manager' || user?.managerStatus !== 'approved') {
    return null; // Il redirect avverrà nell'useEffect
  }

  if (user?.restaurantId) {
    return null; // Il redirect avverrà nell'useEffect
  }

  return html`
    <${SetupLayout}
      section="first-restaurant-setup"
      context="manager bootstrap"
      status=${step === 3 ? 'setup complete' : 'awaiting creation'}
    >
      <section class="setup-panel">
        <${CreateFirstRestaurantWizard}
          onSubmit=${handleSubmit}
          onSkipDish=${handleSkipDish}
          loading=${loading}
          error=${error}
          user=${user}
        />
      </section>
    <//>
  `;
}

export default CreateFirstRestaurantPage;

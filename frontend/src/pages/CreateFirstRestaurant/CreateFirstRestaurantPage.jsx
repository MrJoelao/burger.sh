/**
 * CreateFirstRestaurantPage - pagina per la creazione del primo ristorante
 * viene mostrata ai manager approvati che non hanno ancora un ristorante
 * usa il layout SetupLayout per un'esperienza full-screen
 */

import { useState } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { SetupLayout } from '../Setup/SetupLayout.jsx';
import { CreateFirstRestaurantWizard } from './CreateFirstRestaurantWizard.jsx';
import { restaurantService } from '../../services/restaurantService.js';
import { useAuthStore } from '../../state/authStore.js';
import { navigate } from '../../router/navigate.js';
import { dashboardPathFor } from '../../domain/roles.js';

export function CreateFirstRestaurantPage() {
  const { user, isAuthenticated, refreshUser } = useAuthStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasCreatedRestaurant, setHasCreatedRestaurant] = useState(false);

  // Redirect se l'utente non è un manager approvato o ha già un ristorante
  if (!isAuthenticated || user?.role !== 'manager' || user?.managerStatus !== 'approved') {
    navigate(dashboardPathFor(user?.role));
    return null;
  }

  if (user?.restaurantId && !hasCreatedRestaurant) {
    navigate('/dashboard/manager');
    return null;
  }

  const handleSubmit = async (payload) => {
    setLoading(true);
    setError('');

    try {
      const result = await restaurantService.createFirstRestaurant(payload);

      if (!result.success) {
        setError(result.message || 'Errore nella creazione del ristorante');
        setLoading(false);
        throw new Error(result.message || 'Errore nella creazione del ristorante');
      }

      setHasCreatedRestaurant(true);

      // Crea i piatti custom uno per uno
      if (payload.dishes && payload.dishes.length > 0) {
        const restaurantId = result.data._id;
        for (const dish of payload.dishes) {
          const dishResult = await restaurantService.createDish(restaurantId, dish);
          if (!dishResult.success) {
            console.error('Errore nella creazione del piatto:', dishResult.message);
          }
        }
      }

      // Ricarica i dati utente per aggiornare il restaurantId
      await refreshUser();

      // Non navighiamo qui: il wizard gestisce la transizione alla schermata di congratulazioni.
      setLoading(false);
    } catch (submissionError) {
      setError(submissionError.message || 'Errore nella creazione del ristorante');
      setLoading(false);
      throw submissionError; // il wizard deve sapere che è fallito
    }
  };

  const handleSuccess = () => {
    navigate('/dashboard/manager');
  };

  return html`
    <${SetupLayout}
      section="first-restaurant-setup"
      context="manager bootstrap"
      status=${loading ? 'creating...' : 'awaiting creation'}
    >
      <section class="setup-panel">
        <${CreateFirstRestaurantWizard}
          onSubmit=${handleSubmit}
          loading=${loading}
          error=${error}
          user=${user}
          onSuccess=${handleSuccess}
        />
      </section>
    <//>
  `;
}

export default CreateFirstRestaurantPage;

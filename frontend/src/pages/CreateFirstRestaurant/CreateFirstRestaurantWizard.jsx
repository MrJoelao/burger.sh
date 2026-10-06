/**
 * CreateFirstRestaurantWizard - wizard guidato per la creazione del primo ristorante
 * passo 1: info base (nome, indirizzo, città, telefono, partita IVA)
 * passo 2: riepilogo
 * passo 3: aggiunta piatti custom (opzionale, lista con + per aggiungere)
 * passo 4: schermata di congratulazioni in stile terminale
 */

import { useState, useEffect, useRef } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { TerminalButton } from '../../components/Auth/TerminalButton.jsx';
import { restaurantService } from '../../services/restaurantService.js';
import '../../styles/address-suggestions.css';

const STEPS = [
  { eyebrow: 'first restaurant / identity', title: 'IDENTITÀ DELLA FILIALE', subtitle: 'Diamo un nome e una sede al tuo ristorante.' },
  { eyebrow: 'first restaurant / review', title: 'CONTROLLA I DATI', subtitle: 'Verifica che tutto sia corretto prima di procedere.' },
  { eyebrow: 'first restaurant / menu', title: 'IL TUO MENU', subtitle: 'Aggiungi i piatti custom del tuo ristorante. Puoi saltare e aggiungerli dopo.' },
  { eyebrow: 'first restaurant / done', title: 'Tutto pronto!', subtitle: 'La tua filiale è stata creata con successo.' }
];

const INITIAL_VALUES = {
  name: '',
  street: '',
  city: '',
  zip: '',
  phone: '',
  vatNumber: ''
};

function validateStep(step, values, dishes) {
  const errors = {};

  if (step === 0) {
    if (!values.name.trim()) errors.name = 'Inserisci il nome della filiale';
    else if (values.name.trim().length < 2) errors.name = 'Almeno 2 caratteri';

    if (!values.street.trim()) errors.street = 'Inserisci l\'indirizzo';
    else if (values.street.trim().length < 5) errors.street = 'Indirizzo troppo corto';

    if (!values.city.trim()) errors.city = 'Inserisci la città';
    else if (values.city.trim().length < 2) errors.city = 'Almeno 2 caratteri';

    if (!values.zip.trim()) errors.zip = 'Inserisci il CAP';
    else if (!/^\d{5}$/.test(values.zip.trim())) errors.zip = 'CAP non valido';

    if (!values.phone.trim()) errors.phone = 'Inserisci il telefono';
    else if (!/^\+?[0-9\s\-()]+$/.test(values.phone)) errors.phone = 'Telefono non valido';

    if (!values.vatNumber.trim()) errors.vatNumber = 'Inserisci la partita IVA';
  }

  // Validazione piatti: solo se ce ne sono
  if (step === 2 && dishes.length > 0) {
    dishes.forEach((dish, index) => {
      if (!dish.name.trim()) errors[`dish_${index}_name`] = 'Nome richiesto';
      if (!dish.price || isNaN(dish.price) || parseFloat(dish.price) <= 0) {
        errors[`dish_${index}_price`] = 'Prezzo valido richiesto';
      }
      if (dish.photoUrl && !isValidUrl(dish.photoUrl)) {
        errors[`dish_${index}_photoUrl`] = 'Inserisci un URL valido';
      }
    });
  }

  return errors;
}

function isValidUrl(value) {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function Field({ label, name, value, onInput, error, type = 'text', placeholder, wide = false, autocomplete }) {
  return html`
    <div class=${wide ? 'wizard-field wide' : 'wizard-field'}>
      <label>
        ${label}
        <input
          type=${type}
          name=${name}
          autocomplete=${autocomplete}
          placeholder=${placeholder}
          value=${value}
          onInput=${onInput}
          aria-invalid=${Boolean(error)}
          aria-describedby=${error ? `${name}-error` : undefined}
        />
      </label>
      ${error && html`<span class="form-message" id=${`${name}-error`}>${error}</span>`}
    </div>
  `;
}

export function CreateFirstRestaurantWizard({
  onSubmit = () => {},
  loading = false,
  error = '',
  user = null,
  onSuccess = () => {}
}) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(INITIAL_VALUES);
  const [dishes, setDishes] = useState([]);
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const debounceRef = useRef(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDish, setNewDish] = useState({ name: '', price: '', type: '', photoUrl: '', ingredientIds: [] });
  const [ingredients, setIngredients] = useState([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);
  const [ingredientsError, setIngredientsError] = useState('');
  const [ingredientsLoaded, setIngredientsLoaded] = useState(false);
  const [newIngredientName, setNewIngredientName] = useState('');
  const [newIngredientAllergens, setNewIngredientAllergens] = useState('');
  const [newIngredientError, setNewIngredientError] = useState('');
  const [creatingIngredient, setCreatingIngredient] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const update = (field, value) => {
    setValues(previous => ({ ...previous, [field]: value }));
    if (errors[field]) setErrors(previous => ({ ...previous, [field]: '' }));
  };

  const handleStreetChange = (event) => {
    const v = event.target.value;
    setLat(null);
    setLng(null);
    update('street', v);
    if (v.length > 3) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setSuggestLoading(true);
        fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(v)}&format=jsonv2&addressdetails=1&limit=5`)
          .then(r => r.json())
          .then(data => {
            setSuggestions(data);
            setSuggestLoading(false);
          });
      }, 300);
    } else {
      setSuggestions([]);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (step !== 2 || ingredientsLoaded || ingredientsLoading) return;

    setIngredientsLoading(true);
    restaurantService.getIngredients({ limit: 100 })
      .then(result => setIngredients(result.data || []))
      .catch(() => setIngredientsError('Impossibile caricare gli ingredienti disponibili.'))
      .finally(() => {
        setIngredientsLoading(false);
        setIngredientsLoaded(true);
      });
  }, [step, ingredientsLoaded, ingredientsLoading]);

  function selectSuggestion(item) {
    setSuggestions([]);
    setLat(item.lat);
    setLng(item.lon);
    const addr = item.address || {};
    update('street', `${addr.road || ''} ${addr.house_number || ''}`.trim());
    if (addr.city || addr.town || addr.village) {
      update('city', addr.city || addr.town || addr.village);
    }
    if (addr.postcode) {
      update('zip', addr.postcode);
    }
  }



  const updateNewDish = (field, value) => {
    setNewDish(previous => ({ ...previous, [field]: value }));
    const errorKey = `dish_new_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  };

  const createIngredient = async () => {
    const name = newIngredientName.trim();
    if (name.length < 2) {
      setNewIngredientError('Inserisci almeno 2 caratteri');
      return;
    }

    setCreatingIngredient(true);
    setNewIngredientError('');
    try {
      const allergens = newIngredientAllergens.split(',').map(item => item.trim()).filter(Boolean);
      const result = await restaurantService.createIngredient(name, allergens);
      const ingredient = result.data;
      setIngredients(previous => [...previous.filter(item => item._id !== ingredient._id), ingredient]
        .sort((a, b) => a.name.localeCompare(b.name)));
      setNewDish(previous => ({
        ...previous,
        ingredientIds: previous.ingredientIds.includes(ingredient._id)
          ? previous.ingredientIds
          : [...previous.ingredientIds, ingredient._id]
      }));
      setNewIngredientName('');
      setNewIngredientAllergens('');
    } catch (creationError) {
      setNewIngredientError(creationError.message || 'Impossibile aggiungere l\'ingrediente');
    } finally {
      setCreatingIngredient(false);
    }
  };

  const addDish = () => {
    const dishErrors = {};

    if (!newDish.name.trim()) dishErrors.dish_new_name = 'Nome richiesto';
    if (!newDish.type.trim()) dishErrors.dish_new_type = 'Tipologia richiesta';
    if (!newDish.price || parseFloat(newDish.price) <= 0) dishErrors.dish_new_price = 'Prezzo valido richiesto';
    if (newDish.photoUrl && !isValidUrl(newDish.photoUrl.trim())) dishErrors.dish_new_photoUrl = 'Inserisci un URL valido';
    setErrors(dishErrors);
    if (Object.keys(dishErrors).length > 0) return;

    setDishes(previous => [...previous, {
      name: newDish.name.trim(),
      price: parseFloat(newDish.price),
      type: newDish.type.trim(),
      photoUrl: newDish.photoUrl.trim(),
      ingredientIds: newDish.ingredientIds
    }]);

    setNewDish({ name: '', price: '', type: '', photoUrl: '', ingredientIds: [] });
    setShowAddForm(false);
    setErrors({});
  };

  const removeDish = (index) => {
    setDishes(previous => previous.filter((_, i) => i !== index));
  };

  const back = () => {
    setErrors({});
    setStep(previous => Math.max(previous - 1, 0));
  };

  const next = async (event) => {
    event.preventDefault();
    const nextErrors = validateStep(step, values, dishes);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (step === STEPS.length - 2) {
      // Submit fase - gestito interamente dal wizard
      setSubmitting(true);
      try {
        const payload = buildPayload(values, dishes, lat, lng);
        await onSubmit(payload);
        setStep(3);
      } catch (e) {
        // errore: il page componente gestisce l'errore e lo propaga via loading/error props
        setSubmitting(false);
      }
      return;
    }

    setStep(previous => Math.min(previous + 1, STEPS.length - 1));
  };

  const current = STEPS[step];

  return html`
    <form class="auth-form register-wizard" onSubmit=${next} novalidate>
      ${step < 3 && html`
        <div class="wizard-progress" aria-label="Avanzamento creazione ristorante">
          ${STEPS.map((item, index) => html`
            <span class=${`wizard-progress-step ${index === step ? 'active' : ''} ${index < step ? 'complete' : ''}`}>
              <b>${String(index + 1).padStart(2, '0')}</b> ${item.title.replace('.', '').toLowerCase()}
            </span>
          `)}
        </div>
      `}

      <div class="wizard-viewport">
        <section class="register-wizard-step" key=${step} aria-labelledby="wizard-step-title">
          ${step === 0 && html`
            <p class="wizard-explainer">
              Ciao <b>${user?.name || 'Manager'}</b>, ora creiamo la tua prima filiale.
              Compila i dati sotto per registrare il ristorante.
            </p>
            <div class="wizard-fields two-up">
              <${Field} label="nome filiale" name="name" placeholder="es. Burger House Milano" value=${values.name} error=${errors.name} onInput=${event => update('name', event.target.value)} wide />
              <div class="wizard-field wide address-field-wrapper">
                <${Field} label="indirizzo" name="street" autocomplete="street-address" placeholder="Via Roma 1" value=${values.street} error=${errors.street} onInput=${handleStreetChange} />
                ${suggestions.length > 0 && html`<ul class="address-suggestions">${suggestions.map((s, i) => html`<li key=${i} onClick=${() => selectSuggestion(s)}>${s.display_name}</li>`)}</ul>`}
              </div>
              <${Field} label="città" name="city" autocomplete="address-level2" placeholder="Milano" value=${values.city} error=${errors.city} onInput=${event => update('city', event.target.value)} />
              <${Field} label="CAP" name="zip" autocomplete="postal-code" placeholder="20100" value=${values.zip} error=${errors.zip} onInput=${event => update('zip', event.target.value)} />
              <${Field} label="telefono" name="phone" type="tel" autocomplete="tel" placeholder="+39 02 1234567" value=${values.phone} error=${errors.phone} onInput=${event => update('phone', event.target.value)} />
              <${Field} label="partita IVA" name="vatNumber" autocomplete="off" placeholder="IT0000000000" value=${values.vatNumber} error=${errors.vatNumber} onInput=${event => update('vatNumber', event.target.value)} />
            </div>
          `}

          ${step === 1 && html`
            <p class="wizard-explainer">Ecco un riepilogo dei dati che inserirai. Puoi tornare indietro per modificarli.</p>
            <div class="setup-review wizard-review">
              <p><span>nome filiale</span><b>${values.name || '-'}</b></p>
              <p><span>indirizzo</span><b>${values.street || '-'}</b></p>
              <p><span>città</span><b>${values.city || '-'}</b></p>
              <p><span>CAP</span><b>${values.zip || '-'}</b></p>
              <p><span>telefono</span><b>${values.phone || '-'}</b></p>
              <p><span>partita IVA</span><b>${values.vatNumber || '-'}</b></p>
            </div>
            <p class="wizard-hint">Se qualcosa non va, torna indietro con il pulsante.</p>
          `}

          ${step === 2 && html`
            <p class="wizard-explainer">
              Ora puoi aggiungere piatti custom al menu della tua filiale.
              È opzionale: puoi saltare e aggiungerli dopo dalla dashboard.
            </p>

            ${dishes.length > 0 && html`
              <div class="dish-list">
                <p class="eyebrow">PIATTI AGGIUNTI (${dishes.length})</p>
                ${dishes.map((dish, index) => html`
                  <div class="dish-item" key=${index}>
                    <div class="dish-info">
                      <span class="dish-type badge">${dish.type}</span>
                      <span class="dish-name"><b>${dish.name}</b></span>
                      ${dish.photoUrl && html`<span class="dish-desc">foto configurata</span>`}
                      ${dish.ingredientIds.length > 0 && html`<span class="dish-desc">${dish.ingredientIds.length} ingredienti collegati</span>`}
                      <span class="dish-price">${dish.price.toFixed(2)} €</span>
                    </div>
                    <button type="button" class="dish-remove" onClick=${() => removeDish(index)} aria-label="rimuovi piatto">[ X ]</button>
                  </div>
                `)}
              </div>
            `}

            ${showAddForm && html`
              <div class="dish-add-form">
                <p class="eyebrow">AGGIUNGI NUOVO PIATTO</p>
                <p class="wizard-hint dish-schema-hint">Il piatto sarà salvato come custom della filiale. Foto e ingredienti sono opzionali.</p>
                <div class="wizard-fields">
                  <${Field} label="nome piatto" name="dishName" placeholder="es. Burger Classico" value=${newDish.name} error=${errors.dish_new_name} onInput=${event => updateNewDish('name', event.target.value)} wide />
                  <${Field} label="prezzo (€)" name="dishPrice" type="number" inputmode="decimal" placeholder="8.50" value=${newDish.price} error=${errors.dish_new_price} onInput=${event => updateNewDish('price', event.target.value)} />
                  <${Field} label="tipologia" name="dishType" placeholder="es. burger, pizza, bevanda" value=${newDish.type} error=${errors.dish_new_type} onInput=${event => updateNewDish('type', event.target.value)} />
                  <${Field} label="foto (URL, opzionale)" name="dishPhotoUrl" type="url" placeholder="https://..." value=${newDish.photoUrl} error=${errors.dish_new_photoUrl} onInput=${event => updateNewDish('photoUrl', event.target.value)} wide />
                  <div class="wizard-field wide">
                    <span>ingredienti (opzionale)</span>
                    <div class="ingredient-create">
                      <input
                        type="text"
                        name="newIngredient"
                        placeholder="es. cipolla rossa"
                        value=${newIngredientName}
                        onInput=${event => {
                          setNewIngredientName(event.target.value);
                          setNewIngredientError('');
                        }}
                        aria-label="nome nuovo ingrediente"
                      />
                      <input
                        type="text"
                        name="newIngredientAllergens"
                        placeholder="allergeni: glutine, lattosio"
                        value=${newIngredientAllergens}
                        onInput=${event => setNewIngredientAllergens(event.target.value)}
                        aria-label="allergeni nuovo ingrediente"
                      />
                      <button type="button" class="ingredient-create-button" onClick=${createIngredient} disabled=${creatingIngredient}>
                        ${creatingIngredient ? '[ ... ]' : '[ + ]'} nuovo ingrediente
                      </button>
                    </div>
                    ${newIngredientError && html`<span class="form-message">${newIngredientError}</span>`}
                    ${ingredientsLoading && html`<p class="wizard-hint">Caricamento ingredienti...</p>`}
                    ${ingredientsError && html`<p class="form-message">${ingredientsError}</p>`}
                    ${!ingredientsLoading && !ingredientsError && ingredients.length === 0 && html`<p class="wizard-hint">Nessun ingrediente disponibile.</p>`}
                    ${ingredients.length > 0 && html`
                      <div class="ingredient-picker" aria-label="Ingredienti disponibili">
                        ${ingredients.map(ingredient => {
                          const selected = newDish.ingredientIds.includes(ingredient._id);
                          return html`
                            <button
                              type="button"
                              class=${`ingredient-card ${selected ? 'selected' : ''}`}
                              aria-pressed=${selected}
                              onClick=${() => updateNewDish('ingredientIds', selected
                                ? newDish.ingredientIds.filter(id => id !== ingredient._id)
                                : [...newDish.ingredientIds, ingredient._id])}
                            >
                              <span>${ingredient.name}</span>
                              <b>${selected ? '✓' : '+'}</b>
                            </button>
                          `;
                        })}
                      </div>
                    `}
                  </div>
                </div>
                <div class="dish-add-actions">
                  <${TerminalButton} type="button" onClick=${() => { setShowAddForm(false); setErrors({}); }}>[ anulla ]</${TerminalButton}>
                  <${TerminalButton} primary type="button" onClick=${addDish}>[ + ] aggiungi piatto</${TerminalButton}>
                </div>
              </div>
            `}

            ${!showAddForm && dishes.length === 0 && html`
              <div class="dish-empty">
                <p class="eyebrow">nessun piatto aggiunto</p>
                <p class="wizard-hint">I piatti custom possono essere aggiunti dopo dalla dashboard.</p>
              </div>
            `}

            ${!showAddForm && html`
              <div class="dish-add-btn">
                <${TerminalButton} type="button" onClick=${() => setShowAddForm(true)}>[ + ] aggiungi un piatto custom</${TerminalButton}>
              </div>
            `}
          `}

          ${step === 3 && html`
            <div class="congrats-fullscreen">
              <div class="congrats-content">
                <p class="congrats-eyebrow">first restaurant / done</p>
                <div class="congrats-logo">burger.sh</div>
                <div class="congrats-check">✓</div>
                <h2 class="congrats-title">filiale creata con successo</h2>
                <div class="congrats-details">
                  <p><span>nome</span> <b>${values.name}</b></p>
                  <p><span>sede</span> <b>${values.street}, ${values.zip} ${values.city}</b></p>
                  <p><span>telefono</span> <b>${values.phone}</b></p>
                  <p><span>partita iva</span> <b>${values.vatNumber}</b></p>
                  ${dishes.length > 0 && html`<p><span>piatti custom</span> <b>${dishes.length}</b></p>`}
                  <p class="status-line"><span>stato</span> <b style=${{ color: 'var(--acid)' }}>attiva</b></p>
                </div>
                <p class="congrats-welcome">benvenuto a bordo, <b>${user?.name}</b>!</p>
                <${TerminalButton} primary type="button" onClick=${onSuccess}>[ → ] vai alla dashboard</${TerminalButton}>
              </div>
            </div>
          `}
        </section>
      </div>

      ${error && html`<p class="form-message" aria-live="polite">${error}</p>`}

      ${step < 3 && html`
        <div class="wizard-actions">
          ${step > 0
            ? html`<${TerminalButton} type="button" onClick=${back}>[ ← ] indietro<//>`
            : html``}
          <${TerminalButton} primary type="submit" disabled=${loading || submitting}>
            [ → ] ${submitting ? 'creazione...' : 'continua'}
          <//>
        </div>
      `}
    </form>
  `;
}

function buildPayload(values, dishes, lat, lng) {
  const payload = {
    name: values.name.trim(),
    address: values.street.trim(),
    city: values.city.trim(),
    zip: values.zip.trim(),
    phone: values.phone.trim(),
    vatNumber: values.vatNumber.trim()
  };

  if (lat !== null && lng !== null) {
    payload.location = { lat: Number(lat), lng: Number(lng) };
  }

  if (dishes.length > 0) {
    payload.dishes = dishes.map(d => ({
      name: d.name,
      price: d.price,
      type: d.type,
      ...(d.photoUrl ? { photoUrl: d.photoUrl } : {}),
      ...(d.ingredientIds.length > 0 ? { ingredientIds: d.ingredientIds } : {})
    }));
  }

  return payload;
}

export default CreateFirstRestaurantWizard;

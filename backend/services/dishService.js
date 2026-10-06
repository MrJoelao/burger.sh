const Dish = require('../models/Dish');
const Ingredient = require('../models/Ingredient');
const { isAdmin, isManager, isOwner, unauthorized } = require('../utils/authorization');
const { containsFilter, parseNonNegativeNumber } = require('../utils/searchFilters');

/* logica di dominio dei piatti: gestisce sia il menu base sia i piatti
   custom, creati da un manager per un ristorante specifico. il controller
   resta un sottile adattatore http su queste funzioni, sullo stesso modello
   già seguito da orderController/orderService e authController/authService. */

/* chi può creare un piatto: admin (qualsiasi piatto) oppure il manager
   proprietario del ristorante, ma solo se il piatto è custom */
function canCreateDish(user, isCustom, restaurant) {
  const ownerId = restaurant?.managerId;

  if (isAdmin(user) || (Boolean(isCustom) && isManager(user) && isOwner(ownerId, user.id))) {
    return { authorized: true };
  }

  return unauthorized();
}

/* chi può modificare o eliminare un piatto: admin, oppure il manager
   proprietario del ristorante, ma solo se il piatto è custom (i piatti
   del menu base non sono gestibili dai manager) */
function canManageDish(user, dish) {
  const ownerId = dish?.restaurantId?.managerId;

  if (isAdmin(user) || (dish?.isCustom === true && isManager(user) && isOwner(ownerId, user.id))) {
    return { authorized: true };
  }

  return unauthorized();
}

/* popola un piatto con gli ingredienti e i dati essenziali del ristorante,
   così la risposta contiene già tutto ciò che serve al client. i populate
   multipli vanno passati in un unico array, perché concatenare più chiamate
   .populate() non è supportato dalla versione di mongoose in uso */
function populateDish(dish) {
  return dish.populate([
    { path: 'ingredientIds', select: 'name allergens' },
    { path: 'restaurantId', select: 'name city' }
  ]);
}

// trova gli id degli ingredienti il cui nome contiene il testo cercato
async function ingredientIdsByName(name) {
  const ingredients = await Ingredient.find({ name: containsFilter(name) }, '_id');
  return ingredients.map((ingredient) => ingredient._id);
}

// trova gli id degli ingredienti che hanno tra i loro allergeni un match con il testo cercato
async function ingredientIdsByAllergen(allergen) {
  const ingredients = await Ingredient.find({ allergens: containsFilter(allergen) }, '_id');
  return ingredients.map((ingredient) => ingredient._id);
}

/* costruisce le condizioni di ricerca opzionali per GET /api/dishes: nome e
   tipologia sono match parziali diretti sul piatto, prezzo è un range,
   ingrediente e allergene passano invece dalla collezione Ingredient (un
   piatto "per allergene" viene escluso se uno dei suoi ingredienti contiene
   quell'allergene, così il cliente allergico può filtrare via i piatti a
   rischio) */
async function buildDishSearchConditions({ name, type, minPrice, maxPrice, ingredient, allergen }) {
  const conditions = [];

  const nameFilter = containsFilter(name);
  if (nameFilter) {
    conditions.push({ name: nameFilter });
  }

  const typeFilter = containsFilter(type);
  if (typeFilter) {
    conditions.push({ type: typeFilter });
  }

  const min = parseNonNegativeNumber(minPrice, 'minPrice');
  const max = parseNonNegativeNumber(maxPrice, 'maxPrice');
  if (min !== undefined || max !== undefined) {
    conditions.push({
      price: {
        ...(min !== undefined ? { $gte: min } : {}),
        ...(max !== undefined ? { $lte: max } : {})
      }
    });
  }

  if (ingredient) {
    conditions.push({ ingredientIds: { $in: await ingredientIdsByName(ingredient) } });
  }

  if (allergen) {
    conditions.push({ ingredientIds: { $nin: await ingredientIdsByAllergen(allergen) } });
  }

  return conditions;
}

/* esegue la query paginata dei piatti in base al filtro passato, condivisa
   tra il listing generale e quello per ristorante */
async function listDishes(filter, { limit, skip }) {
  const [total, dishes] = await Promise.all([
    Dish.countDocuments(filter),
    Dish.find(filter)
      .skip(skip)
      .limit(limit)
      .populate('ingredientIds', 'name allergens')
      .populate('restaurantId', 'name city')
  ]);

  return { total, dishes };
}

module.exports = {
  canCreateDish,
  canManageDish,
  populateDish,
  buildDishSearchConditions,
  listDishes
};

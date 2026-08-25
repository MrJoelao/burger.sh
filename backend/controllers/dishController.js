const Dish = require('../models/Dish');
const Restaurant = require('../models/Restaurant');
const Ingredient = require('../models/Ingredient');

const {
  isAdmin,
  isManager,
  isOwner,
  unauthorized,
  findOrThrow
} = require('../utils/authorization');
const { jsonOk, jsonMessage, jsonPaginated, handleAuth, notFound, badRequest } = require('../utils/httpResponses');
const { containsFilter, parseNonNegativeNumber, combineFilters } = require('../utils/searchFilters');

/* gestisce sia i piatti del menu base sia i piatti
   custom, creati da un manager per un ristorante specifico. */

/* chi può creare un piatto: admin (qualsiasi piatto) oppure il manager
   proprietario del ristorante, ma solo se il piatto è custom */
function canCreateDish(req, isCustom, restaurant) {
  const user = req.user;
  const ownerId = restaurant?.managerId;

  if (isAdmin(user) || (Boolean(isCustom) && isManager(user) && isOwner(ownerId, user.id))) {
    return { authorized: true };
  }

  return unauthorized();
}

/* chi può modificare o eliminare un piatto: admin, oppure il manager
   proprietario del ristorante, ma solo se il piatto è custom (i piatti
   del menu base non sono gestibili dai manager) */
function canManageDish(req, dish) {
  const user = req.user;
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
async function populateDish(dish) {
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

// get tutti i piatti, con filtri di ricerca opzionali (nome, tipologia, prezzo, ingrediente, allergene)
async function getAllDishes(req, res, next) {
  try {
    const pagination = req.pagination || { page: 1, limit: 10, skip: 0 };

    const filter = combineFilters(await buildDishSearchConditions(req.query));
    const { total, dishes } = await listDishes(filter, pagination);

    return jsonPaginated(res, 200, pagination.page, pagination.limit, total, dishes);
  } catch (err) {
    return next(err);
  }
}

/* get piatti per ristorante: restituisce i piatti del menu base (validi
   per tutti i ristoranti) uniti ai piatti custom di quel ristorante,
   con gli stessi filtri di ricerca opzionali di getAllDishes */
async function getDishesByRestaurant(req, res, next) {
  try {
    const { restaurantId } = req.params;
    const pagination = req.pagination || { page: 1, limit: 10, skip: 0 };

    const belongsToRestaurantMenu = {
      $or: [
        { isCustom: false },
        { isCustom: true, restaurantId }
      ]
    };
    const searchConditions = await buildDishSearchConditions(req.query);
    const filter = combineFilters([belongsToRestaurantMenu, ...searchConditions]);

    const { total, dishes } = await listDishes(filter, pagination);

    return jsonPaginated(res, 200, pagination.page, pagination.limit, total, dishes);
  } catch (err) {
    return next(err);
  }
}

// get piatto per id
async function getDishById(req, res, next) {
  try {
    const dish = await findOrThrow(Dish.findById(req.params.id).populate('restaurantId'), 'Dish not found');
    const populatedDish = await populateDish(dish);

    return jsonOk(res, 200, populatedDish);
  } catch (err) {
    return next(err);
  }
}

/* create piatto: un piatto normale finisce nel menu base, un piatto
   custom viene invece legato a un ristorante specifico */
async function createDish(req, res, next) {
  try {
    const {
      name,
      type,
      price,
      photoUrl,
      ingredientIds,
      isCustom = false,
      restaurantId
    } = req.validated;

    let restaurant = null;

    // se il piatto è custom, il ristorante è obbligatorio e deve esistere
    if (isCustom) {
      if (!restaurantId) {
        throw badRequest('restaurantId is required for custom dishes');
      }

      restaurant = await Restaurant.findById(restaurantId);

      if (!restaurant) {
        throw notFound('Restaurant not found');
      }
    }

    const authCheck = canCreateDish(
      req,
      isCustom,
      restaurant
    );

    if (!authCheck.authorized) {
      return handleAuth(res, authCheck);
    }

    const dish = await Dish.create({
      name,
      type,
      price,
      photoUrl: photoUrl || '',
      ingredientIds: ingredientIds || [],
      isCustom: Boolean(isCustom),
      restaurantId: isCustom ? restaurantId : null
    });

    const populatedDish = await populateDish(dish);

    return jsonOk(res, 201, populatedDish);
  } catch (err) {
    return next(err);
  }
}

// update piatto
async function updateDish(req, res, next) {
  try {
    const { id } = req.params;
    const updates = { ...req.validated };

    const dish = await findOrThrow(Dish.findById(id).populate('restaurantId'), 'Dish not found');

    const authCheck = canManageDish(req, dish);

    if (!authCheck.authorized) {
      return handleAuth(res, authCheck);
    }

    // isCustom e restaurantId non sono modificabili dopo la creazione
    delete updates.isCustom;
    delete updates.restaurantId;

    const updatedDish = await Dish.findByIdAndUpdate(
      id,
      updates,
      {
        returnDocument: 'after',
        runValidators: true
      }
    );

    const populatedDish = await populateDish(updatedDish);

    return jsonOk(res, 200, populatedDish);
  } catch (err) {
    return next(err);
  }
}

// delete piatto
async function deleteDish(req, res, next) {
  try {
    const dish = await findOrThrow(Dish.findById(req.params.id).populate('restaurantId'), 'Dish not found');

    const authCheck = canManageDish(req, dish);

    if (!authCheck.authorized) {
      return handleAuth(res, authCheck);
    }

    await dish.constructor.deleteOne({ _id: dish._id });

    return jsonMessage(res, 200, 'Dish deleted successfully');
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getAllDishes,
  getDishesByRestaurant,
  getDishById,
  createDish,
  updateDish,
  deleteDish
};

export function filterDishes(dishes = [], filters = {}) {
  const query = normalize(filters.query);
  const type = normalize(filters.type);
  const minPrice = numberOrUndefined(filters.minPrice);
  const maxPrice = numberOrUndefined(filters.maxPrice);
  const excludedAllergens = (filters.excludedAllergens || []).map(normalize).filter(Boolean);

  return dishes.filter(dish => {
    if (query && !searchText(dish).includes(query)) return false;
    if (type && normalize(dish.type) !== type) return false;
    if (minPrice !== undefined && Number(dish.price) < minPrice) return false;
    if (maxPrice !== undefined && Number(dish.price) > maxPrice) return false;
    return !excludedAllergens.some(allergen => dishAllergens(dish).includes(allergen));
  });
}

function searchText(dish) {
  return [
    dish.name,
    dish.description,
    ...(dish.ingredientIds || []).map(ingredient => typeof ingredient === 'object' ? ingredient.name : '')
  ].map(normalize).join(' ');
}

function dishAllergens(dish) {
  return (dish.ingredientIds || [])
    .flatMap(ingredient => typeof ingredient === 'object' ? ingredient.allergens || [] : [])
    .map(normalize);
}

function normalize(value) {
  return String(value || '').trim().toLocaleLowerCase('it-IT');
}

function numberOrUndefined(value) {
  if (String(value || '').trim() === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

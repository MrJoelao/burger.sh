const GUEST_CART_KEY_PREFIX = 'burger.sh.guest-cart.';

function cartKey(restaurantId) {
  return `${GUEST_CART_KEY_PREFIX}${restaurantId}`;
}

export function guestCartFor(restaurantId) {
  try {
    const saved = localStorage.getItem(cartKey(restaurantId));
    const items = JSON.parse(saved || '[]');
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export function saveGuestCart(restaurantId, items) {
  const key = cartKey(restaurantId);

  if (items.length === 0) {
    localStorage.removeItem(key);
    return;
  }

  localStorage.setItem(key, JSON.stringify(items));
}

export function addGuestCartItem(items, dish) {
  const dishId = String(dish.id || dish._id);
  const existing = items.find(item => item.dishId === dishId);

  if (existing) {
    return changeGuestCartQuantity(items, dishId, existing.quantity + 1);
  }

  return [...items, {
    dishId,
    name: dish.name,
    price: Number(dish.price) || 0,
    quantity: 1
  }];
}

export function changeGuestCartQuantity(items, dishId, quantity) {
  if (quantity <= 0) {
    return items.filter(item => item.dishId !== dishId);
  }

  return items.map(item => (
    item.dishId === dishId ? { ...item, quantity } : item
  ));
}

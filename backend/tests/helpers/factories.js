/* factory di supporto per creare rapidamente entità valide nel database
   di test (utenti, ristoranti, piatti, ordini) e token jwt associati,
   evitando di ripetere in ogni test i campi obbligatori dei modelli. */

const User = require('../../models/User');
const Restaurant = require('../../models/Restaurant');
const Dish = require('../../models/Dish');
const Ingredient = require('../../models/Ingredient');
const Order = require('../../models/Order');
const PaymentMethod = require('../../models/PaymentMethod');
const { hashPassword } = require('../../utils/password');
const { signUser } = require('../../utils/jwt');

let counter = 0;

// genera un valore incrementale, utile per evitare collisioni su campi unique (es. email)
function unique() {
  counter += 1;
  return counter;
}

async function createUser(overrides = {}) {
  const n = unique();
  const userData = {
    name: 'Mario',
    surname: 'Rossi',
    email: `user${n}@example.com`,
    passwordHash: await hashPassword('password123'),
    role: 'customer',
    ...overrides
  };

  return User.create(userData);
}

async function createManager(overrides = {}) {
  return createUser({ role: 'manager', managerStatus: 'approved', ...overrides });
}

async function createAdmin(overrides = {}) {
  return createUser({ role: 'admin', ...overrides });
}

async function createRestaurant(overrides = {}) {
  const n = unique();
  let managerId = overrides.managerId;

  // se non passato, crea un manager proprietario di default
  if (!managerId) {
    const manager = await createManager();
    managerId = manager._id;
  }

  const restaurantData = {
    name: `Burger House ${n}`,
    address: `Via Roma ${n}`,
    city: 'Milano',
    phone: '+39 02 1234567',
    vatNumber: `IT0000000${n}`,
    managerId,
    ...overrides
  };

  return Restaurant.create(restaurantData);
}

async function createIngredient(overrides = {}) {
  const n = unique();
  return Ingredient.create({
    name: `Ingrediente ${n}`,
    allergens: [],
    ...overrides
  });
}

async function createDish(overrides = {}) {
  const n = unique();
  const dishData = {
    name: `Panino ${n}`,
    type: 'burger',
    price: 8.5,
    ingredientIds: [],
    isCustom: false,
    restaurantId: null,
    ...overrides
  };

  return Dish.create(dishData);
}

async function createOrder(overrides = {}) {
  let { customerId, restaurantId, dishId } = overrides;

  if (!customerId) {
    const customer = await createUser();
    customerId = customer._id;
  }

  if (!restaurantId) {
    const restaurant = await createRestaurant();
    restaurantId = restaurant._id;
  }

  if (!dishId) {
    const dish = await createDish();
    dishId = dish._id;
  }

  const orderData = {
    customerId,
    restaurantId,
    orderItems: [{ dishId, quantity: 1, unitPrice: 8.5 }],
    status: 'ordered',
    mode: 'pickup',
    totalAmount: 8.5,
    orderCode: `FF-TEST${unique()}`,
    ...overrides
  };

  // rimuove le chiavi usate solo per la risoluzione dei riferimenti di default
  delete orderData.dishId;

  return Order.create(orderData);
}

async function createPaymentMethod(overrides = {}) {
  let { customerId } = overrides;

  if (!customerId) {
    const customer = await createUser();
    customerId = customer._id;
  }

  const paymentMethodData = {
    customerId,
    type: 'card',
    label: 'Carta principale',
    details: '4242',
    isDefault: false,
    ...overrides
  };

  return PaymentMethod.create(paymentMethodData);
}

// genera il token jwt corrispondente a uno user già creato (o a un oggetto con _id e role)
function tokenFor(user) {
  return signUser(user);
}

module.exports = {
  createUser,
  createManager,
  createAdmin,
  createRestaurant,
  createIngredient,
  createDish,
  createOrder,
  createPaymentMethod,
  tokenFor
};

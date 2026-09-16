const Ingredient = require('../models/Ingredient');
const Restaurant = require('../models/Restaurant');
const { jsonOk, jsonPaginated } = require('../utils/httpResponses');

async function getAllIngredients(req, res, next) {
  try {
    const pagination = req.pagination || { page: 1, limit: 100, skip: 0 };
    const restaurant = req.user
      ? await Restaurant.findOne({ managerId: req.user.id }).select('_id')
      : null;
    const restaurantId = restaurant?._id || null;
    const managerId = req.user?.id || null;
    const filter = restaurantId
      ? { $or: [{ restaurantId: null, managerId: null }, { restaurantId }, { managerId }] }
      : { restaurantId: null };
    const [total, ingredients] = await Promise.all([
      Ingredient.countDocuments(filter),
      Ingredient.find({}, '_id name allergens')
        .find(filter)
        .sort({ name: 1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean()
    ]);

    return jsonPaginated(res, 200, pagination.page, pagination.limit, total, ingredients);
  } catch (error) {
    return next(error);
  }
}

async function createIngredient(req, res, next) {
  try {
    const { name, allergens } = req.validated;
    const restaurant = await Restaurant.findOne({ managerId: req.user.id }).select('_id');
    const restaurantId = restaurant?._id || null;
    const managerId = restaurantId ? null : req.user.id;
    const existing = await Ingredient.findOne({
      name: new RegExp(`^${escapeRegExp(name)}$`, 'i'),
      restaurantId,
      managerId
    });
    if (existing) return jsonOk(res, 200, existing);

    const ingredient = await Ingredient.create({ name, allergens, restaurantId, managerId });
    return jsonOk(res, 201, ingredient);
  } catch (error) {
    return next(error);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { getAllIngredients, createIngredient };

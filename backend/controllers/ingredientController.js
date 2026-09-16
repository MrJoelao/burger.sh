const Ingredient = require('../models/Ingredient');
const Restaurant = require('../models/Restaurant');
const { jsonOk, jsonPaginated, jsonMessage, handleAuth } = require('../utils/httpResponses');
const { findOrThrow } = require('../utils/authorization');

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
      Ingredient.find({}, '_id name allergens restaurantId managerId')
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

async function updateIngredient(req, res, next) {
    try {
      const ingredient = await findOrThrow(Ingredient.findById(req.params.id), 'Ingredient not found');
      const authorization = await ingredientAuthorization(req.user, ingredient);
      if (!authorization.authorized) return handleAuth(res, authorization);

      const updated = await Ingredient.findByIdAndUpdate(
        req.params.id,
        req.validated,
        { returnDocument: 'after', runValidators: true }
      ).lean();
      return jsonOk(res, 200, updated);
    } catch (error) {
      return next(error);
    }
}

async function deleteIngredient(req, res, next) {
    try {
      const ingredient = await findOrThrow(Ingredient.findById(req.params.id), 'Ingredient not found');
      const authorization = await ingredientAuthorization(req.user, ingredient);
      if (!authorization.authorized) return handleAuth(res, authorization);

      await Ingredient.deleteOne({ _id: ingredient._id });
      return jsonMessage(res, 200, 'Ingredient deleted successfully');
    } catch (error) {
      return next(error);
    }
}

async function ingredientAuthorization(user, ingredient) {
    const restaurant = await Restaurant.findOne({ managerId: user.id }).select('_id').lean();
    const ownsIngredient = ingredient.managerId?.toString() === user.id.toString()
      || (restaurant && ingredient.restaurantId?.toString() === restaurant._id.toString());
    return ownsIngredient
      ? { authorized: true }
      : { authorized: false, statusCode: 403, message: 'You cannot manage this ingredient' };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { getAllIngredients, createIngredient, updateIngredient, deleteIngredient };

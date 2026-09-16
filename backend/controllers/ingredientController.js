const Ingredient = require('../models/Ingredient');
const { jsonOk, jsonPaginated } = require('../utils/httpResponses');

async function getAllIngredients(req, res, next) {
  try {
    const pagination = req.pagination || { page: 1, limit: 100, skip: 0 };
    const [total, ingredients] = await Promise.all([
      Ingredient.countDocuments({}),
      Ingredient.find({}, '_id name allergens')
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
    const name = req.validated.name;
    const existing = await Ingredient.findOne({ name: new RegExp(`^${escapeRegExp(name)}$`, 'i') });
    if (existing) return jsonOk(res, 200, existing);

    const ingredient = await Ingredient.create({ name });
    return jsonOk(res, 201, ingredient);
  } catch (error) {
    return next(error);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { getAllIngredients, createIngredient };

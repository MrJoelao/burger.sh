const Dish = require('../models/Dish');
const Restaurant = require('../models/Restaurant');

// GET tutti i piatti
async function getAllDishes(req, res, next) {
  try {
    const dishes = await Dish.find()
      .populate('ingredientIds', 'name allergens')
      .populate('restaurantId', 'name city');
    
    return res.status(200).json({
      success: true,
      data: dishes
    });
  } catch (err) {
    next(err);
  }
}

// GET piatti by restaurant
async function getDishesByRestaurant(req, res, next) {
  try {
    const { restaurantId } = req.params;

    const dishes = await Dish.find({
      $or: [
        { isCustom: false },
        { isCustom: true, restaurantId }
      ]
    })
      .populate('ingredientIds', 'name allergens')
      .populate('restaurantId', 'name city');

    return res.status(200).json({
      success: true,
      data: dishes
    });
  } catch (err) {
    next(err);
  }
}

// GET piatto by ID
async function getDishById(req, res, next) {
  try {
    const { id } = req.params;

    const dish = await Dish.findById(id)
      .populate('ingredientIds', 'name allergens')
      .populate('restaurantId', 'name city');

    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: dish
    });
  } catch (err) {
    next(err);
  }
}

// CREATE piatto (solo manager della filiale o admin)
async function createDish(req, res, next) {
  try {
    const { name, type, price, photoUrl, ingredientIds, isCustom, restaurantId } = req.validated;

    // se è un piatto personalizzato, il ristorante deve esistere
    if (isCustom && restaurantId) {
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        return res.status(400).json({
          success: false,
          message: 'Restaurant not found'
        });
      }
    }

    const dish = await Dish.create({
      name,
      type,
      price,
      photoUrl: photoUrl || '',
      ingredientIds: ingredientIds || [],
      isCustom: isCustom || false,
      restaurantId: isCustom ? restaurantId : null
    });

    const populatedDish = await dish.populate('ingredientIds', 'name allergens').populate('restaurantId', 'name city');

    return res.status(201).json({
      success: true,
      data: populatedDish
    });
  } catch (err) {
    next(err);
  }
}

// UPDATE piatto
async function updateDish(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.validated;

    const dish = await Dish.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    })
      .populate('ingredientIds', 'name allergens')
      .populate('restaurantId', 'name city');

    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: dish
    });
  } catch (err) {
    next(err);
  }
}

// DELETE piatto
async function deleteDish(req, res, next) {
  try {
    const { id } = req.params;

    const dish = await Dish.findByIdAndDelete(id);
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Dish deleted successfully'
    });
  } catch (err) {
    next(err);
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

const express = require("express");
const {
  createProduct,
  getAProduct,
  getAllProducts,
  updateProduct,
  deleteAProduct,
  getAllProductsSorted,
  getRelatedProducts,
  getProductFilters,
} = require("../../controller/productCtrl");
const router = express.Router();
const { authMiddleware, isAdmin } = require("../../middlewares/authMiddleware");
const Product = require("../../models/productModel");
const loadProductFilters = require("../../middlewares/loadProductFilters");
// routes/Web/webCategoriesRoute.js
const asyncHandler = require('express-async-handler'); // ✅ ADD THIS IMPORT

// Middleware: Load category filters (dynamic counts from DB)
const loadCategoryFilters = asyncHandler(async (req, res, next) => {
  try {
    // Get unique categories with product counts
    const categoryStats = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } }
    ]);

    // Get unique brands with counts
    const brandStats = await Product.aggregate([
      { $group: { _id: '$brand', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } }
    ]);

    // Get price range stats
    const priceStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      }
    ]);

    // Generate dynamic price ranges
    const minPrice = priceStats[0]?.minPrice || 0;
    const maxPrice = priceStats[0]?.maxPrice || 10000;
    const priceRanges = [];
    
    if (minPrice < 500) {
      priceRanges.push({ label: 'Under $500', value: '0-500', min: 0, max: 499.99 });
    }
    let start = Math.max(500, Math.floor(minPrice / 500) * 500);
    while (start < maxPrice) {
      const end = start + 499.99;
      if (end >= maxPrice) {
        priceRanges.push({ label: `$${start.toLocaleString()}+`, value: `${start}+`, min: start, max: Infinity });
        break;
      }
      priceRanges.push({ 
        label: `$${start.toLocaleString()} - $${(start + 499).toLocaleString()}`, 
        value: `${start}-${start + 499}`,
        min: start,
        max: start + 499
      });
      start += 500;
    }

    // Attach to res.locals for use in view
    res.locals.filters = {
      categories: categoryStats.map(c => ({ name: c._id, count: c.count })),
      brands: brandStats.map(b => ({ name: b._id, count: b.count })),
      priceRanges
    };

    next();
  } catch (error) {
    console.error('Load category filters error:', error);
    res.locals.filters = { categories: [], brands: [], priceRanges: [] };
    next();
  }
});

// GET /categories - Render categories page
router.get('/', loadCategoryFilters, async (req, res) => {
  try {
    const { sort, filter, view = 'grid' } = req.query;

    // Map frontend sort values
    const sortMap = {
      'name-asc': { _id: 1 },
      'name-desc': { _id: -1 },
      'count-asc': { count: 1 },
      'count-desc': { count: -1 },
    };
    const sortBy = sortMap[sort] || { count: -1, _id: 1 };

    // Build aggregation pipeline for categories
    const pipeline = [
      { $group: { _id: '$category', count: { $sum: 1 }, latest: { $max: '$createdAt' } } },
      ...(filter ? [{ $match: { count: { $gte: parseInt(filter) } } }] : []),
      { $sort: sortBy },
      { $project: { 
        _id: 0, 
        name: '$_id', 
        count: 1, 
        latest: 1,
        slug: { $toLower: { $replaceAll: { input: '$_id', find: ' ', replacement: '-' } } }
      }}
    ];

    const categories = await Product.aggregate(pipeline);
    const totalCategories = categories.length;

    res.render('pages/categories', {
      title: 'Categories',
      categories: categories,
      layout: 'layouts/main',
      currentSort: sort,
      currentFilter: filter,
      currentView: view,
      totalCategories,
      filters: res.locals.filters,
    });
    
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).render('error', { message: 'Failed to load categories' });
  }
});

// GET /api/categories - JSON API endpoint
router.get('/api/categories', asyncHandler(async (req, res) => {
  const { minCount = 0, sort = 'count-desc' } = req.query;
  
  const sortMap = {
    'name-asc': { _id: 1 },
    'name-desc': { _id: -1 },
    'count-asc': { count: 1 },
    'count-desc': { count: -1 },
  };
  
  const pipeline = [
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $match: { count: { $gte: parseInt(minCount) } } },
    { $sort: sortMap[sort] || { count: -1 } },
    { $project: { _id: 0, name: '$_id', count: 1 } }
  ];
  
  const categories = await Product.aggregate(pipeline);
  
  res.json({
    success: true,
    count: categories.length,
    data: categories
  });
}));

module.exports = router;
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

// web does not need to create yet.
/* router.post("/", authMiddleware, isAdmin, createProduct);//create a new product */

// GET /api/products/filters - Return dynamic filter options
router.get("/filters", getProductFilters);

//router.get("/", getAllProducts);//get all products as JSON, for web home
router.get("/dev", getAllProducts); //get all products, no fields ommited: for development purposes
/**router.get("/products/", getAllProductsSorted);//get all products and sort accordingly */
// web user does not need delete yet: router.delete("/:id", authMiddleware, isAdmin, deleteAProduct);//delete a product

// modifications for web ///
const { isAuthenticated } = require("../../middlewares/authMiddleware");
const Cart = require("../../models/cartModel");

/* // updating
//get get all products using UI
router.get("/", async (req, res) => {
    try {
      const allProducts = await getAllProducts(req, res); // Fetch all products
      res.render("pages/home", {
        title: "Home",
        products: allProducts, // Pass products to the view
        layout: "layouts/main", // Specify the layout to use
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
  });*/

// GET / - Home page with products and dynamic filters
router.get("/", async (req, res) => {
  try {
    // Fetch all products (your existing function)
    const products = await Product.find().select("-__v").sort("-createdAt");

    // 🔥 Fetch distinct filter values from database
    const [categories, brands, colors, priceStats] = await Promise.all([
      Product.distinct("category"),
      Product.distinct("brand"),
      Product.distinct("color"),
      Product.aggregate([
        {
          $group: {
            _id: null,
            minPrice: { $min: "$price" },
            maxPrice: { $max: "$price" },
          },
        },
      ]),
    ]);

    // Generate dynamic price ranges
    const minPrice = priceStats[0]?.minPrice || 0;
    const maxPrice = priceStats[0]?.maxPrice || 10000;
    const priceRanges = generateDynamicPriceRanges(minPrice, maxPrice);

    res.render("pages/home", {
      title: "Home",
      products: products,
      layout: "layouts/main",
      // 🔥 Pass dynamic filter data to EJS template
      filters: {
        categories: categories.sort(),
        brands: brands.sort(),
        colors: colors.sort(),
        priceRanges: priceRanges,
      },
    });
  } catch (error) {
    console.error("Root route error:", error);
    res.status(500).send("Server Error");
  }
});
// Helper: Generate price ranges based on actual product prices
function generateDynamicPriceRanges(min, max) {
  const ranges = [];

  if (min < 500) {
    ranges.push({ label: "Under $500", value: "0-500", min: 0, max: 499.99 });
  }

  let start = Math.max(500, Math.floor(min / 500) * 500);
  while (start < max) {
    const end = start + 499.99;
    if (end >= max) {
      ranges.push({
        label: `$${start.toLocaleString()}+`,
        value: `${start}+`,
        min: start,
        max: Infinity,
      });
      break;
    }
    ranges.push({
      label: `$${start.toLocaleString()} - $${(start + 499).toLocaleString()}`,
      value: `${start}-${start + 499}`,
      min: start,
      max: start + 499,
    });
    start += 500;
  }

  return ranges;
}

router.get("/products", loadProductFilters, async (req, res) => {
  try {
    // Set default sort to newest first
    // req.query.sort = "-createdAt";
    // const allProducts = await getAllProductsSorted(req, res);

    //////////////////////////////////////////////////////////////////////

    const { sort, page = 1, limit = 10,...filters } = req.query;
    //limit is causing a fixed number of products to be loaded

    // Map frontend sort values to MongoDB fields
    const sortMap = {
      newest: "-createdAt",
      oldest: "createdAt",
      "price-low": "price",
      "price-high": "-price",
      "name-asc": "title",
      "name-desc": "-title",
      sales: "-sold",
    };

    const sortBy = sortMap[sort] || "-createdAt"; // Default: newest first

    // Build query from filters (exclude pagination/sort params)
    const query = {};
    if (filters.category) query.category = filters.category;
    if (filters.brand) query.brand = filters.brand;
    if (filters.color) query.color = filters.color;
    if (filters.price) {
      // Handle price range like "500-1000" or "2000+"
      if (filters.price.includes("+")) {
        query.price = { $gte: parseInt(filters.price) };
      } else if (filters.price.includes("-")) {
        const [min, max] = filters.price.split("-").map(Number);
        query.price = { $gte: min, $lte: max };
      }
    }
    // Add more filter mappings as needed...

    // Execute query with sorting and pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sortBy)
        .skip(skip)
        .limit(parseInt(limit))
        .select("-__v"),
      Product.countDocuments(query),
    ]);

    //////////////////////////////////////////////////////////////////////

    res.render("pages/products", {
      title: "Products",
      products: products,
      layout: "layouts/main",
      // ✅ ADD THESE for UI state preservation:
      currentSort: sort, // Current sort value from URL
      currentPage: parseInt(page), // Current page number
      totalPages: Math.ceil(total / parseInt(limit)), // Total pages for pagination
      currentFilters: filters, // Active filters for UI highlighting
      currentLimit: parseInt(limit), // Items per page
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).render("error", { message: "Failed to load products" });
  }
});

// GET /api/products/related - Get related products by category
router.get("/product/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).render("pages/error", {
        title: "Product Not Found",
        message: "The requested product could not be found.",
        layout: "layouts/main",
      });
    }
    res.render("pages/product", {
      title: product.title,
      product: product,
      layout: "layouts/main",
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("pages/error", {
      title: "Server Error",
      message: "An error occurred while fetching the product.",
      layout: "layouts/main",
    });
  }
});

// modifications for web ///

module.exports = router;

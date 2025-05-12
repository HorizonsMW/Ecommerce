const express = require("express");
const {
  createProduct,
  getAProduct,
  getAllProducts,
  updateProduct,
  deleteAProduct,
  getAllProductsSorted,
} = require("../../controller/productCtrl");
const router = express.Router();
const { authMiddleware, isAdmin } = require("../../middlewares/authMiddleware");
const Product = require("../../models/productModel");

// web does not need to create yet.
/* router.post("/", authMiddleware, isAdmin, createProduct);//create a new product */

//router.get("/", getAllProducts);//get all products as JSON, for web home
router.get("/dev", getAllProducts); //get all products, no fields ommited: for development purposes
/**router.get("/products/", getAllProductsSorted);//get all products and sort accordingly */
router.get("/products/:id", getAProduct); //get a product
router.put("/products/:id", authMiddleware, isAdmin, updateProduct); //update a product
// web user does not need delete yet: router.delete("/:id", authMiddleware, isAdmin, deleteAProduct);//delete a product

// modifications for web ///
const { isAuthenticated } = require("../../middlewares/authMiddleware");
const Cart = require("../../models/cartModel");

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
  });

  router.get("/products", async (req, res) => {
    try {
      // Set default sort to newest first
      req.query.sort = "-createdAt";
      const allProducts = await getAllProductsSorted(req, res);
      res.render("pages/products", {
        title: "Products",
        products: allProducts,
        layout: "layouts/main",
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
  });

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

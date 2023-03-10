const express = require("express");
const { createProduct, getAProduct, getAllProducts, updateProduct, deleteAProduct, getAllProductsSorted } = require("../controller/productCtrl");
const router = express.Router();
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

router.post("/", authMiddleware, isAdmin, createProduct);//create a new product
router.get("/", getAllProducts);//get all products
router.get("/products/", getAllProductsSorted);//get all products and sort accordingly
router.get("/:id", getAProduct);//get a product
router.put("/:id", authMiddleware, isAdmin, updateProduct);//update a product
router.delete("/:id", authMiddleware, isAdmin, deleteAProduct);//delete a product

module.exports = router;
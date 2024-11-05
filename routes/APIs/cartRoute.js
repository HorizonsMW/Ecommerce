const express = require("express");
const { 
    addToCart, 
    updateCartItem, 
    removeFromCart, 
    getCart 
} = require("../../controller/cartCtrl");
const { authMiddleware } = require("../../middlewares/authMiddleware");
const router = express.Router();

router.post("/add", authMiddleware, addToCart);
router.get("/", authMiddleware, getCart);
router.put("/update", authMiddleware, updateCartItem);
router.delete("/remove/:productId", authMiddleware, removeFromCart);

module.exports = router; 
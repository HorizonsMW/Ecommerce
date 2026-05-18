const express = require("express");
const { 
    addToCart, 
    updateCartItem, 
    removeFromCart, 
    getCart 
} = require("../../controller/cartCtrl");
const { authMiddleware } = require("../../middlewares/authMiddleware");
const router = express.Router();
/**
router.post("/add", authMiddleware, addToCart);
router.get("/", authMiddleware, getCart);
router.put("/update", authMiddleware, updateCartItem);
router.delete("/remove/:productId", authMiddleware, removeFromCart);*/


const { isLoggedIn } = require('../../middlewares/authMiddleware');
const User = require('../../models/userModel');
const Product = require('../../models/productModel');

// GET /cart - Render cart page
router.get('/', (req, res) => {
  res.render('pages/cart', {
    title: 'Your Cart',
    layout: 'layouts/main'
  });
});

// API: GET /api/cart - Get cart items
router.get('/api/cart', isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('cart');
    const populatedCart = await Promise.all(
      user.cart.map(async (cartItem) => {
        const product = await Product.findById(cartItem.productId).select('title price images brand color');
        return {
          ...cartItem.toObject(),
          product: product ? product.toObject() : null
        };
      })
    );
    res.json(populatedCart);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch cart' });
  }
});

// API: POST /api/cart/add - Add item to cart
router.post('/api/cart/add', isLoggedIn, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product.quantity < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }
    
    const user = await User.findById(req.user._id);
    const existing = user.cart.find(item => item.productId.toString() === productId);
    
    if (existing) {
      existing.quantity += quantity;
    } else {
      user.cart.push({ productId, quantity });
    }
    
    await user.save();
    
    const cartCount = user.cart.reduce((sum, item) => sum + item.quantity, 0);
    res.json({ success: true, cartCount });
    
  } catch (error) {
    res.status(500).json({ message: 'Failed to add to cart' });
  }
});

// API: POST /api/cart/sync - Sync entire cart
router.post('/api/cart/sync', isLoggedIn, async (req, res) => {
  try {
    const { items } = req.body;
    const user = await User.findById(req.user._id);
    
    items.forEach(guestItem => {
      const existing = user.cart.find(item => 
        item.productId.toString() === guestItem.productId
      );
      
      if (existing) {
        existing.quantity = Math.max(existing.quantity, guestItem.quantity);
      } else {
        user.cart.push({
          productId: guestItem.productId,
          quantity: guestItem.quantity
        });
      }
    });
    
    await user.save();
    res.json({ success: true });
    
  } catch (error) {
    res.status(500).json({ message: 'Failed to sync cart' });
  }
});

// API: DELETE /api/cart/:productId - Remove item
router.delete('/api/cart/:productId', isLoggedIn, async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);
    
    user.cart = user.cart.filter(item => 
      item.productId.toString() !== productId
    );
    
    await user.save();
    res.json({ success: true });
    
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove item' });
  }
});

module.exports = router; 
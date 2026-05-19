const express = require("express");
const { isLoggedIn } = require('../../middlewares/authMiddleware');
const User = require('../../models/userModel');
const Product = require('../../models/productModel');
const { ObjectId } = require('mongodb');

const router = express.Router();

// ========================================
// WEB ROUTES (EJS Page Rendering)
// ========================================

// GET /cart - Render cart page
router.get('/', (req, res) => {
  res.render('pages/cart', {
    title: 'Your Cart',
    layout: 'layouts/main'
  });
});

// ========================================
// API ROUTES (JSON Responses for embedded cart array)
// ========================================

// ✅ GET /cart/items - API: Get cart items from user.cart array
router.get('/items', isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('cart');
    
    // ✅ Your schema: cart is a direct array on user
    const cartItems = Array.isArray(user?.cart) ? user.cart : [];
    
    if (cartItems.length === 0) {
      return res.json({ items: [], cartTotal: 0 });
    }
    
    // Populate product details for each cart item
    const populatedCart = await Promise.all(
      cartItems.map(async (cartItem) => {
        // Extract productId from various formats
        const productId = cartItem.productId?.$oid || cartItem.productId || cartItem;
        
        const product = await Product.findById(productId)
          .select('title price images brand color quantity');
        
        return {
          _id: cartItem._id?.toString?.() || null,
          productId: productId?.toString?.() || productId,
          quantity: cartItem.quantity || 1,
          price: cartItem.price || product?.price || 0,
          title: cartItem.title || product?.title || 'Unknown',
          image: cartItem.image || product?.images?.[0] || null,
          brand: cartItem.brand || product?.brand || '',
          color: cartItem.color || product?.color || '',
          availableStock: product?.quantity || 0
        };
      })
    );
    
    // Calculate total from cart array
    const cartTotal = cartItems.reduce(
      (sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 
      0
    );
    
    res.json({
      items: populatedCart,
      cartTotal: cartTotal
    });
    
  } catch (error) {
    console.error('Error fetching cart items:', error);
    res.status(500).json({ message: 'Failed to fetch cart' });
  }
});

// ✅ POST /cart/add - Add/increment item in user.cart array
router.post('/add', isLoggedIn, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }
    
    // Clean productId to string
    const cleanProductId = typeof productId === 'string' 
      ? productId 
      : (productId.$oid || productId._id || productId);
    
    if (typeof cleanProductId !== 'string' || cleanProductId.length !== 24) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }
    
    let productObjectId;
    try {
      productObjectId = new ObjectId(cleanProductId);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }
    
    // Fetch product to check stock and get details
    const product = await Product.findById(productObjectId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Fetch user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // ✅ Ensure cart is an array (your schema)
    if (!Array.isArray(user.cart)) {
      user.cart = [];
    }
    
    // ✅ Find existing cart item by productId (handle ObjectId formats)
    const cartItemIndex = user.cart.findIndex(item => {
      const itemProductId = item.productId?.$oid || item.productId?._id || item.productId || item;
      return itemProductId?.toString?.() === cleanProductId;
    });
    
    const currentQty = cartItemIndex !== -1 ? user.cart[cartItemIndex].quantity : 0;
    const newQuantity = currentQty + quantity;
    
    // ✅ Check stock availability
    if (newQuantity > product.quantity) {
      return res.status(400).json({ 
        message: `Only ${product.quantity} items available in stock` 
      });
    }
    
    if (cartItemIndex !== -1) {
      // ✅ Increment existing item in array
      user.cart[cartItemIndex].quantity = newQuantity;
    } else {
      // ✅ Add new item to cart array
      user.cart.push({
        productId: productObjectId,
        quantity: quantity,
        price: product.price,
        title: product.title,
        image: product.images?.[0] || null,
        brand: product.brand,
        color: product.color
      });
    }
    
    // ✅ Recalculate cart total from array
    const cartTotal = user.cart.reduce(
      (sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 
      0
    );
    
    // ✅ Mark cart as modified and save
    user.markModified('cart');
    await user.save();
    
    // Return updated cart count
    const cartCount = user.cart.reduce(
      (sum, item) => sum + (item.quantity || 1), 
      0
    );
    
    res.json({ 
      success: true, 
      cartCount,
      cartTotal 
    });
    
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ 
      message: 'Failed to update cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ POST /cart/update - Update quantity in user.cart array
router.post('/update', isLoggedIn, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    if (!productId || typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({ message: 'Invalid request data' });
    }
    
    let productObjectId;
    try {
      productObjectId = new ObjectId(productId);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }
    
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (!Array.isArray(user.cart)) {
      user.cart = [];
    }
    
    // Fetch product for stock validation
    const product = await Product.findById(productObjectId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    // ✅ Find cart item index in array
    const cartItemIndex = user.cart.findIndex(item => {
      const itemProductId = item.productId?.$oid || item.productId?._id || item.productId || item;
      return itemProductId?.toString?.() === productId;
    });
    
    if (cartItemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }
    
    const cartItem = user.cart[cartItemIndex];
    
    // ✅ Validate stock for increases
    if (quantity > 0 && quantity > product.quantity) {
      return res.status(400).json({ 
        message: `Only ${product.quantity} items available in stock` 
      });
    }
    
    if (quantity === 0) {
      // ✅ Remove item from array
      user.cart.splice(cartItemIndex, 1);
    } else {
      // ✅ Update quantity in array
      cartItem.quantity = quantity;
    }
    
    // ✅ Recalculate total
    const cartTotal = user.cart.reduce(
      (sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 
      0
    );
    
    // ✅ Save with markModified for array changes
    user.markModified('cart');
    await user.save();
    
    const cartCount = user.cart.reduce(
      (sum, item) => sum + (item.quantity || 1), 
      0
    );
    
    res.json({ 
      success: true, 
      cartCount,
      cartTotal 
    });
    
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ 
      message: 'Failed to update cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ POST /cart/sync - Sync guest cart to user.cart array
router.post('/sync', isLoggedIn, async (req, res) => {
  try {
    const { items } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!Array.isArray(user.cart)) {
      user.cart = [];
    }
    
    // Merge guest cart items with user's cart array
    items.forEach(guestItem => {
      const existingIndex = user.cart.findIndex(item => {
        const itemProductId = item.productId?.$oid || item.productId?._id || item.productId || item;
        return itemProductId?.toString?.() === guestItem.productId;
      });
      
      if (existingIndex !== -1) {
        // Keep higher quantity
        user.cart[existingIndex].quantity = Math.max(
          user.cart[existingIndex].quantity, 
          guestItem.quantity
        );
      } else {
        // Add new item to array
        user.cart.push({
          productId: guestItem.productId,
          quantity: guestItem.quantity,
          price: guestItem.price || 0,
          title: guestItem.title || '',
          image: guestItem.image || null
        });
      }
    });
    
    // Recalculate total
    const cartTotal = user.cart.reduce(
      (sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 
      0
    );
    
    user.markModified('cart');
    await user.save();
    
    res.json({ success: true, cartTotal });
    
  } catch (error) {
    console.error('Error syncing cart:', error);
    res.status(500).json({ message: 'Failed to sync cart' });
  }
});

// ✅ DELETE /cart/:productId - Remove item from user.cart array
router.delete('/:productId', isLoggedIn, async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);
    
    if (!Array.isArray(user?.cart)) {
      return res.json({ success: true });
    }
    
    // ✅ Filter out the item to remove (handle ObjectId formats)
    const originalLength = user.cart.length;
    user.cart = user.cart.filter(item => {
      const itemProductId = item.productId?.$oid || item.productId?._id || item.productId || item;
      return itemProductId?.toString?.() !== productId;
    });
    
    // Only save if something was actually removed
    if (user.cart.length < originalLength) {
      // Recalculate total
      const cartTotal = user.cart.reduce(
        (sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 
        0
      );
      
      user.markModified('cart');
      await user.save();
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ message: 'Failed to remove item' });
  }
});

module.exports = router;
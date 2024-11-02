const asyncHandler = require("express-async-handler");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const { validateMongoDbId } = require("../utils/validateMongodbId");

// Add to Cart
const addToCart = asyncHandler(async (req, res) => {
    const { productId, quantity } = req.body;
    console.log(req.body);

    const userId = req.user._id;
    
    try {
        // Validate product exists and has sufficient inventory
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error("Product not found");
        }
        if (product.quantity < quantity) {
            throw new Error("Insufficient product inventory");
        }

        // Find existing cart or create new one
        let cart = await Cart.findById(userId);
        if (!cart) {
            cart = await Cart.create({
                _id: userId,
                items: [],
                cartTotal: 0
            });
        }

        // Check if product already exists in cart
        const existingItemIndex = cart.items.findIndex(
            item => item.productId.toString() === productId
        );

        if (existingItemIndex > -1) {
            // Update quantity if product exists
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item if product doesn't exist in cart
            cart.items.push({
                productId,
                quantity,
                price: product.price,
                title: product.title
            });
        }

        // Calculate cart total
        cart.cartTotal = cart.items.reduce(
            (total, item) => total + (item.price * item.quantity),
            0
        );

        await cart.save();
        res.json(cart);
    } catch (error) {
        throw new Error(error);
    }
});

// Update Cart
const updateCartItem = asyncHandler(async (req, res) => {
    const { productId, action } = req.body;
    const userId = req.user._id;

    try {
        let cart = await Cart.findById(userId);
        if (!cart) {
            cart = await Cart.create({
                _id: userId,
                items: [],
                cartTotal: 0
            });
        }

        const itemIndex = cart.items.findIndex(
            item => item.productId.toString() === productId
        );

        if (itemIndex > -1) {
            // Item exists in cart
            if (action === 'decrement') {
                if (cart.items[itemIndex].quantity === 1) {
                    cart.items.splice(itemIndex, 1);
                } else {
                    cart.items[itemIndex].quantity -= 1;
                }
            } else if (action === 'increment') {
                cart.items[itemIndex].quantity += 1;
            }
        } else if (action === 'increment') {
            // Item not in cart - fetch product and add it
            const product = await Product.findById(productId);
            if (!product) {
                throw new Error("Product not found");
            }

            cart.items.push({
                productId,
                quantity: 1,
                price: product.price,
                title: product.title
            });
        } else {
            throw new Error("Item not found in cart");
        }

        // Recalculate cart total
        cart.cartTotal = cart.items.reduce(
            (total, item) => total + (item.price * item.quantity),
            0
        );

        await cart.save();
        res.json(cart);
    } catch (error) {
        throw new Error(error);
    }
});

// Remove from Cart
const removeFromCart = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const userId = req.user._id;

    try {
        const cart = await Cart.findById(userId);
        if (!cart) {
            throw new Error("Cart not found");
        }

        // Find the item index
        const itemIndex = cart.items.findIndex(
            item => item.productId.toString() === productId
        );

        // Check if item exists in cart
        if (itemIndex === -1) {
            throw new Error("Item not found in cart");
        }

        // Remove the item using splice
        cart.items.splice(itemIndex, 1);

        // Recalculate cart total
        cart.cartTotal = cart.items.reduce(
            (total, item) => total + (item.price * item.quantity),
            0
        );

        // Save the updated cart
        await cart.save();
        
        res.json({
            success: true,
            message: "Item removed from cart",
            cart: cart
        });
    } catch (error) {
        throw new Error(error);
    }
});

// Get Cart
const getCart = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    try {
        const cart = await Cart.findById(userId)
            .populate('items.productId', 'title price images');
        
        if (!cart) {
            return res.json({ items: [], cartTotal: 0 });
        }
        res.json(cart);
    } catch (error) {
        throw new Error(error);
    }
});

module.exports = {
    addToCart,
    updateCartItem,
    removeFromCart,
    getCart
}; 
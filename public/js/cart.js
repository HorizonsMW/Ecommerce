// ========================================
// CART FUNCTIONALITY - cart.js (FIXED)
// Handles backend cart structure: { items: [...], cartTotal }
// ========================================

class CartManager {
  constructor() {
    this.storageKey = 'cart';
    this.apiBase = `/api/cart`;
    this.token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
    this.items = [];
    this.cartTotal = 0;
  }

  async init() {
    if (this.token) {
      await this.fetchFromAPI();
    } else {
      this.loadFromLocalStorage();
    }
    this.render();
    this.setupEventListeners();
    this.updateCartCount();
  }

  loadFromLocalStorage() {
    try {
      const cart = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      this.items = cart.map(item => ({
        ...item,
        quantity: item.quantity || 1,
        addedAt: item.addedAt || new Date().toISOString()
      }));
      this.cartTotal = this.items.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0);
    } catch (e) {
      console.error('Error loading cart from localStorage:', e);
      this.items = [];
      this.cartTotal = 0;
    }
  }

  /**
   * ✅ FIXED: Fetch cart from API - handles { items, cartTotal } structure
   */
  async fetchFromAPI() {
    try {
      const response = await fetch(`${this.apiBase}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch cart');
      
      const data = await response.json();
      console.log('📦 API cart response:', data); // Debug log
      
      // ✅ Handle backend structure: { items: [...], cartTotal, _id }
      if (data?.items && Array.isArray(data.items)) {
        this.items = data.items.map(item => ({
          // Cart item fields
          cartItemId: item._id, // The cart entry's own ID
          productId: item.productId?.$oid || item.productId, // Handle ObjectId
          quantity: item.quantity || 1,
          price: item.price || 0,
          title: item.title || 'Unknown Product',
          // Optional: fetch image if not included
          image: item.image || null,
          brand: item.brand || '',
          color: item.color || ''
        }));
        this.cartTotal = data.cartTotal || this.calculateSubtotal();
        
        // ✅ If items don't have images, fetch them in batch
        const itemsWithoutImages = this.items.filter(i => !i.image);
        if (itemsWithoutImages.length > 0) {
          await this.fetchProductImages(itemsWithoutImages);
        }
      } else if (Array.isArray(data)) {
        // Fallback: direct array response
        this.items = data;
        this.cartTotal = this.calculateSubtotal();
      } else {
        this.items = [];
        this.cartTotal = 0;
      }
      
    } catch (error) {
      console.error('Error fetching cart from API:', error);
      this.loadFromLocalStorage();
    }
  }

  /**
   * Fetch product images for items that don't have them
   */
  async fetchProductImages(items) {
    try {
      const imageMap = {};
      
      await Promise.all(
        items.map(async (item) => {
          try {
            const res = await fetch(`/api/products/${item.productId}`);
            if (res.ok) {
              const product = await res.json();
              imageMap[item.productId] = product.images?.[0] || null;
            }
          } catch (err) {
            console.warn(`Could not fetch image for ${item.productId}:`, err);
          }
        })
      );
      
      // Update items with fetched images
      this.items = this.items.map(item => ({
        ...item,
        image: imageMap[item.productId] || item.image
      }));
      
    } catch (error) {
      console.error('Error fetching product images:', error);
    }
  }

  calculateSubtotal() {
    return this.items.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0);
  }

  async save() {
    if (this.token) {
      await this.syncWithAPI();
    } else {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    }
    this.render();
    this.updateCartCount();
  }

  async syncWithAPI() {
    try {
      await fetch(`${this.apiBase}/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ items: this.items })
      });
    } catch (error) {
      console.error('Error syncing cart with API:', error);
    }
  }

  async add(product, quantity = 1) {
    const existing = this.items.find(item => 
      (item.productId?.$oid || item.productId) === product._id
    );
    
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.push({
        productId: product._id,
        title: product.title,
        price: product.price,
        image: product.images?.[0] || null,
        brand: product.brand,
        color: product.color,
        quantity: quantity,
        addedAt: new Date().toISOString()
      });
    }
    
    await this.save();
    return this.items;
  }

  async updateQuantity(productId, quantity) {
    if (quantity < 1) return this.remove(productId);
    
    const item = this.items.find(item => 
      (item.productId?.$oid || item.productId) === productId
    );
    if (item) {
      item.quantity = quantity;
      await this.save();
    }
    return this.items;
  }

  async remove(productId) {
    this.items = this.items.filter(item => 
      (item.productId?.$oid || item.productId) !== productId
    );
    await this.save();
    return this.items;
  }

  async clear() {
    this.items = [];
    await this.save();
    return this.items;
  }

  calculateTotals() {
    const subtotal = this.cartTotal || this.calculateSubtotal();
    const shipping = subtotal > 100 ? 0 : 9.99;
    const tax = subtotal * 0.08;
    
    return {
      subtotal: subtotal.toFixed(2),
      shipping: shipping.toFixed(2),
      tax: tax.toFixed(2),
      total: (subtotal + shipping + tax).toFixed(2)
    };
  }

  /**
   * ✅ FIXED: Render cart with proper data mapping
   */
  render() {
    console.log('🛒 Rendering cart with items:', this.items);
    
    const list = document.getElementById('cartItemsList');
    const emptyCart = document.getElementById('emptyCart');
    const cartContent = document.getElementById('cartContent');
    const template = document.getElementById('cartItemTemplate');
    
    if (!list) {
      console.error('❌ cartItemsList element not found');
      return;
    }
    
    if (this.items.length === 0) {
      console.log('📭 Cart is empty');
      if (emptyCart) emptyCart.style.display = 'block';
      if (cartContent) cartContent.style.display = 'none';
      return;
    }
    
    console.log('✅ Cart has items, rendering...');
    if (emptyCart) emptyCart.style.display = 'none';
    if (cartContent) cartContent.style.display = 'block';
    
    list.innerHTML = '';
    
    this.items.forEach((item, index) => {
      // Handle both string and ObjectId productId
      const productId = item.productId?.$oid || item.productId;
      
      console.log(`📦 Rendering item ${index + 1}:`, { 
        id: productId, 
        title: item.title,
        price: item.price,
        quantity: item.quantity
      });
      
      const clone = template.content.cloneNode(true);
      const cartItem = clone.querySelector('.cart-item');
      
      // Set data attribute with string ID for event handling
      cartItem.dataset.productId = productId;
      
      // Safe DOM updates with fallbacks
      const imgEl = clone.querySelector('.cart-item-img');
      if (imgEl) {
        imgEl.src = item.image || '/images/placeholder.jpg';
        imgEl.alt = item.title || 'Product';
      }
      
      const titleEl = clone.querySelector('.cart-item-title');
      if (titleEl) titleEl.textContent = item.title || 'Unknown Product';
      
      const brandEl = clone.querySelector('.cart-item-brand');
      if (brandEl) brandEl.textContent = item.brand || '';
      
      const colorEl = clone.querySelector('.cart-item-color');
      if (colorEl) colorEl.textContent = item.color ? `• ${item.color}` : '';
      
      const priceEl = clone.querySelector('.cart-item-price');
      if (priceEl) priceEl.textContent = `$${(item.price || 0).toFixed(2)}`;
      
      const totalEl = clone.querySelector('.cart-item-total');
      if (totalEl) {
        totalEl.textContent = `$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}`;
      }
      
      const qtyInput = clone.querySelector('.quantity-input');
      if (qtyInput) qtyInput.value = item.quantity || 1;
      
      const decreaseBtn = clone.querySelector('.quantity-btn.decrease');
      if (decreaseBtn && (item.quantity || 1) <= 1) {
        decreaseBtn.disabled = true;
      }
      
      list.appendChild(clone);
    });
    
    this.updateSummary();
  }

  updateSummary() {
    const totals = this.calculateTotals();
    
    const subtotalEl = document.getElementById('subtotalAmount');
    const shippingEl = document.getElementById('shippingAmount');
    const taxEl = document.getElementById('taxAmount');
    const totalEl = document.getElementById('totalAmount');
    
    if (subtotalEl) subtotalEl.textContent = `$${totals.subtotal}`;
    if (shippingEl) shippingEl.textContent = totals.shipping === '0.00' ? 'Free' : `$${totals.shipping}`;
    if (taxEl) taxEl.textContent = `$${totals.tax}`;
    if (totalEl) totalEl.textContent = `$${totals.total}`;
  }

  updateCartCount() {
    const count = this.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const cartCountEl = document.querySelector('.cart-count');
    
    if (cartCountEl) {
      cartCountEl.textContent = count;
      cartCountEl.style.display = count > 0 ? 'flex' : 'none';
      
      cartCountEl.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.3)' },
        { transform: 'scale(1)' }
      ], { duration: 300, easing: 'ease-out' });
    }
  }

  setupEventListeners() {
    const list = document.getElementById('cartItemsList');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (!list) return;
    
    list.addEventListener('click', async (e) => {
      const cartItem = e.target.closest('.cart-item');
      if (!cartItem) return;
      
      const productId = cartItem.dataset.productId;
      
      if (e.target.closest('.cart-item-remove')) {
        await this.remove(productId);
        showCartToast('Item removed from cart', 'success');
        return;
      }
      
      const input = cartItem.querySelector('.quantity-input');
      if (!input) return;
      
      let quantity = parseInt(input.value) || 1;
      
      if (e.target.closest('.quantity-btn.increase')) {
        quantity += 1;
      } else if (e.target.closest('.quantity-btn.decrease') && quantity > 1) {
        quantity -= 1;
      }
      
      input.value = quantity;
      await this.updateQuantity(productId, quantity);
      
      // Update displayed total for this item
      const item = this.items.find(i => 
        (i.productId?.$oid || i.productId) === productId
      );
      if (item) {
        const totalEl = cartItem.querySelector('.cart-item-total');
        if (totalEl) {
          totalEl.textContent = `$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}`;
        }
        this.updateSummary();
      }
    });
    
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        showCartToast('Checkout feature coming soon!', 'success');
      });
    }
  }
}

// Global instance
let cart;

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🛒 cart.js DOMContentLoaded');
  cart = new CartManager();
  await cart.init();
  window.cartManager = cart;
});

// Integration with global addToCart from main.js
async function updateCartFromGlobal(product, quantity = 1) {
  if (!cart) {
    // Guest mode: use localStorage
    const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cartItems.find(item => item.productId === product._id);
    
    if (existing) {
      existing.quantity += quantity;
    } else {
      cartItems.push({
        productId: product._id,
        title: product.title,
        price: product.price,
        image: product.images?.[0] || null,
        quantity: quantity
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cartItems));
    
    const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountEl = document.querySelector('.cart-count');
    if (cartCountEl) {
      cartCountEl.textContent = count;
      cartCountEl.style.display = count > 0 ? 'flex' : 'none';
    }
    return;
  }
  
  // Logged in: use CartManager
  await cart.add(product, quantity);
}

// Toast notifications
function showCartToast(message, type = 'success') {
  const existing = document.getElementById('cart-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'cart-toast';
  toast.className = `cart-toast ${type}`;
  toast.style.cssText = `
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background: ${type === 'success' ? 'var(--success)' : '#ef4444'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 0.75rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    z-index: 2000;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.95rem;
    font-weight: 500;
    animation: slideInRight 0.3s ease;
    max-width: 320px;
  `;
  
  const icon = type === 'success' 
    ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  
  toast.innerHTML = `${icon}<span>${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Toast animations
if (!document.getElementById('cart-toast-styles')) {
  const style = document.createElement('style');
  style.id = 'cart-toast-styles';
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}
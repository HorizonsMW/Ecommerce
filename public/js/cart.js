// ========================================
// CART FUNCTIONALITY - cart.js (FIXED)
// Handles backend cart structure: { items: [...], cartTotal }
// ========================================

// ========================================
// CART FUNCTIONALITY - cart.js (FIXED for /cart routes)
// ========================================

class CartManager {
  constructor() {
    this.storageKey = "cart";
    this.apiBase = `/cart`; // ✅ Fixed: was '/api/cart'
    this.token =
      localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");
    this.items = [];
    this.cartTotal = 0;
  }

  async init() {
    console.log("🛒 CartManager.init() - token:", !!this.token);

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
      const cart = JSON.parse(localStorage.getItem(this.storageKey) || "[]");
      this.items = cart.map((item) => ({
        ...item,
        quantity: item.quantity || 1,
        addedAt: item.addedAt || new Date().toISOString(),
      }));
      this.cartTotal = this.items.reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
        0,
      );
    } catch (e) {
      console.error("Error loading cart from localStorage:", e);
      this.items = [];
      this.cartTotal = 0;
    }
  }

  /**
   * Fetch cart from API at /cart/items
   */
  async fetchFromAPI() {
    try {
      console.log("📡 Fetching cart from:", `${this.apiBase}/items`);

      const response = await fetch(`${this.apiBase}/items`, {
        // ✅ Changed from /cart/cart to /cart/items
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API error:", response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("📦 API cart response:", data);

      if (data?.items && Array.isArray(data.items)) {
        this.items = data.items.map((item) => ({
          cartItemId: item._id,
          productId: item.productId, // Already clean string from backend
          quantity: item.quantity || 1,
          price: item.price || 0,
          title: item.title || "Unknown Product",
          image: item.image || null,
          brand: item.brand || "",
          color: item.color || "",
          availableStock: item.availableStock || 999,
        }));

        this.cartTotal = data.cartTotal || this.calculateSubtotal();
        console.log("✅ Loaded", this.items.length, "items from API");
      } else {
        console.warn("⚠️ Unexpected API response format:", data);
        this.items = [];
        this.cartTotal = 0;
      }
    } catch (error) {
      console.error("Error fetching cart from API:", error);
      this.loadFromLocalStorage();
    }
  }

  calculateSubtotal() {
    return this.items.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
      0,
    );
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
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ items: this.items }),
      });
    } catch (error) {
      console.error("Error syncing cart with API:", error);
    }
  }

  async add(product, quantity = 1) {
    const existing = this.items.find((item) => item.productId === product._id);

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
        addedAt: new Date().toISOString(),
      });
    }

    await this.save();
    return this.items;
  }

  async updateQuantity(productId, quantity) {
    if (quantity < 1) return this.remove(productId);

    const item = this.items.find((item) => item.productId === productId);
    if (item) {
      item.quantity = quantity;

      // ✅ Only sync with API if user is logged in
      if (this.token) {
        await this._syncQuantityWithAPI(productId, quantity);
      }

      // Always update localStorage for guest fallback
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    }
    return this.items;
  }

  /**
   * ✅ Sync single item quantity with backend at /cart/update
   */
  async _syncQuantityWithAPI(productId, quantity) {
    try {
      const response = await fetch(`${this.apiBase}/update`, {
        // ✅ /cart/update
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          productId: productId,
          quantity: quantity,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update quantity");
      }

      return await response.json();
    } catch (error) {
      console.error("Error syncing quantity with API:", error);
      throw error;
    }
  }

  async remove(productId) {
    console.log("🗑️ Removing from cart:", productId);

    // Remove from local state first
    this.items = this.items.filter((item) => item.productId !== productId);

    // Sync with backend if logged in
    if (this.token) {
      try {
        await fetch(`${this.apiBase}/${productId}`, {
          // ✅ DELETE /cart/:productId
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
      } catch (error) {
        console.error("Error removing from API:", error);
        // Revert local change if API fails
        // (optional: you could re-fetch cart here)
      }
    } else {
      // Guest: save to localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    }

    await this.save(); // This will re-render
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
      total: (subtotal + shipping + tax).toFixed(2),
    };
  }

  render() {
    console.log("🛒 Rendering cart with", this.items.length, "items");

    const list = document.getElementById("cartItemsList");
    const emptyCart = document.getElementById("emptyCart");
    const cartContent = document.getElementById("cartContent");
    const template = document.getElementById("cartItemTemplate");

    if (!list) {
      console.error("❌ cartItemsList element not found");
      return;
    }

    if (this.items.length === 0) {
      if (emptyCart) emptyCart.style.display = "block";
      if (cartContent) cartContent.style.display = "none";
      return;
    }

    if (emptyCart) emptyCart.style.display = "none";
    if (cartContent) cartContent.style.display = "block";

    list.innerHTML = "";

    this.items.forEach((item, index) => {
      // ✅ productId is already a clean string from fetchFromAPI
      const productId = item.productId;

      console.log(`📦 Rendering item ${index + 1}:`, {
        id: productId,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
      });

      const clone = template.content.cloneNode(true);
      const cartItem = clone.querySelector(".cart-item");

      // ✅ Set clean string ID
      cartItem.dataset.productId = productId;

      // Safe DOM updates
      const imgEl = clone.querySelector(".cart-item-img");
      if (imgEl) {
        imgEl.src = item.image || "/images/placeholder.jpg";
        imgEl.alt = item.title || "Product";
      }

      const titleEl = clone.querySelector(".cart-item-title");
      if (titleEl) titleEl.textContent = item.title || "Unknown Product";

      const brandEl = clone.querySelector(".cart-item-brand");
      if (brandEl) brandEl.textContent = item.brand || "";

      const colorEl = clone.querySelector(".cart-item-color");
      if (colorEl) colorEl.textContent = item.color ? `• ${item.color}` : "";

      const priceEl = clone.querySelector(".cart-item-price");
      if (priceEl) priceEl.textContent = `$${(item.price || 0).toFixed(2)}`;

      const totalEl = clone.querySelector(".cart-item-total");
      if (totalEl) {
        totalEl.textContent = `$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}`;
      }

      const qtyInput = clone.querySelector(".quantity-input");
      if (qtyInput) qtyInput.value = item.quantity || 1;

      const decreaseBtn = clone.querySelector(".quantity-btn.decrease");
      if (decreaseBtn && (item.quantity || 1) <= 1) {
        decreaseBtn.disabled = true;
      }

      list.appendChild(clone);
    });

    this.updateSummary();
  }

  updateSummary() {
    const totals = this.calculateTotals();

    const subtotalEl = document.getElementById("subtotalAmount");
    const shippingEl = document.getElementById("shippingAmount");
    const taxEl = document.getElementById("taxAmount");
    const totalEl = document.getElementById("totalAmount");

    if (subtotalEl) subtotalEl.textContent = `$${totals.subtotal}`;
    if (shippingEl)
      shippingEl.textContent =
        totals.shipping === "0.00" ? "Free" : `$${totals.shipping}`;
    if (taxEl) taxEl.textContent = `$${totals.tax}`;
    if (totalEl) totalEl.textContent = `$${totals.total}`;
  }

  updateCartCount() {
    const count = this.items.reduce(
      (sum, item) => sum + (item.quantity || 1),
      0,
    );

    // ✅ Update header badge
    const cartCountEl = document.querySelector("#header-cart-count");
    if (cartCountEl) {
      cartCountEl.textContent = count;
      cartCountEl.style.display = count > 0 ? "flex" : "none";

      // Animate
      cartCountEl.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.3)" },
          { transform: "scale(1)" },
        ],
        { duration: 300, easing: "ease-out" },
      );
    }
  }

  setupEventListeners() {
    const list = document.getElementById("cartItemsList");
    const checkoutBtn = document.getElementById("checkoutBtn");

    if (!list) return;

    list.addEventListener("click", async (e) => {
      const cartItem = e.target.closest(".cart-item");
      if (!cartItem) return;

      const productId = cartItem.dataset.productId;
      console.log("🖱️ Cart item click:", {
        productId,
        target: e.target.className,
      });

      // ✅ Handle Remove button
      if (e.target.closest(".cart-item-remove")) {
        console.log("🗑️ Remove clicked for:", productId);
        await this.remove(productId);
        showCartToast("Item removed from cart", "success");
        return;
      }

      // ✅ Handle Quantity buttons
      const input = cartItem.querySelector(".quantity-input");
      if (!input) return;

      const increaseBtn = e.target.closest(".quantity-btn.increase");
      const decreaseBtn = e.target.closest(".quantity-btn.decrease");

      if (increaseBtn) {
        e.preventDefault();
        console.log("⬆️ Increase clicked for:", productId);
        await increaseQuantity(productId, increaseBtn);
        return;
      }

      if (decreaseBtn) {
        e.preventDefault();
        console.log("⬇️ Decrease clicked for:", productId);
        await decreaseQuantity(productId, decreaseBtn);
        return;
      }

      // Fallback: manual input change
      let quantity = parseInt(input.value) || 1;
      if (quantity < 1) quantity = 1;

      input.value = quantity;
      await this.updateQuantity(productId, quantity);

      // Update displayed total
      const item = this.items.find((i) => i.productId === productId);
      if (item) {
        const totalEl = cartItem.querySelector(".cart-item-total");
        if (totalEl) {
          totalEl.textContent = `$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}`;
        }
        this.updateSummary();
      }
    });

    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        showCartToast("Checkout feature coming soon!", "success");
        window.location.href = '/cart/checkout';
      });
    }
  }
}

// Global instance
let cart;

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🛒 cart.js DOMContentLoaded");
  cart = new CartManager();
  await cart.init();
  window.cartManager = cart;
});

// ========================================
// GLOBAL CART FUNCTIONS (for use from main.js)
// ========================================

/**
 * Increase item quantity - uses /cart/add endpoint
 */
async function increaseQuantity(productId, button = null) {
  console.log("⬆️ increaseQuantity:", { productId, type: typeof productId });

  // Ensure clean string ID
  const cleanProductId =
    typeof productId === "string" && productId.length === 24
      ? productId
      : productId?.$oid || productId?._id || productId;

  if (!cleanProductId || typeof cleanProductId !== "string") {
    showCartToast("Error", "Invalid product ID", "error");
    return;
  }

  if (button) {
    button.disabled = true;
    button.innerHTML = '<span class="btn-loader">...</span>';
  }

  try {
    const token =
      localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");

    if (!token) {
      // Guest mode
      const cartItems = JSON.parse(localStorage.getItem("cart") || "[]");
      const item = cartItems.find((i) => i.productId === cleanProductId);
      if (item) {
        item.quantity = (item.quantity || 1) + 1;
        localStorage.setItem("cart", JSON.stringify(cartItems));
        if (window.cartManager) {
          window.cartManager.loadFromLocalStorage();
          window.cartManager.render();
          window.cartManager.updateCartCount();
        }
        showCartToast("Quantity updated", "success");
      }
      return;
    }

    // ✅ Logged in: Call /cart/add with quantity: 1
    const response = await fetch("/cart/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId: cleanProductId, quantity: 1 }),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update quantity");
    }

    const result = await response.json();

    if (window.cartManager) {
      await window.cartManager.fetchFromAPI();
      window.cartManager.render();
      window.cartManager.updateCartCount();
    }

    showCartToast("Quantity updated", "success");
  } catch (error) {
    console.error("Increase error:", error);
    showCartToast(error.message || "Failed to update", "error");
  } finally {
    if (button) {
      button.disabled = false;
      button.innerHTML = "+";
    }
  }
}

/**
 * Decrease item quantity - uses /cart/update endpoint
 */
async function decreaseQuantity(productId, button = null) {
  console.log("⬇️ decreaseQuantity:", { productId });

  const cleanProductId =
    typeof productId === "string" && productId.length === 24
      ? productId
      : productId?.$oid || productId?._id || productId;

  if (!cleanProductId) {
    showCartToast("Error", "Invalid product ID", "error");
    return;
  }

  if (button) button.disabled = true;

  try {
    const token =
      localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");

    if (!token) {
      // Guest mode
      const cartItems = JSON.parse(localStorage.getItem("cart") || "[]");
      const idx = cartItems.findIndex((i) => i.productId === cleanProductId);
      if (idx !== -1) {
        if (cartItems[idx].quantity > 1) {
          cartItems[idx].quantity -= 1;
        } else {
          cartItems.splice(idx, 1);
        }
        localStorage.setItem("cart", JSON.stringify(cartItems));
        if (window.cartManager) {
          window.cartManager.loadFromLocalStorage();
          window.cartManager.render();
          window.cartManager.updateCartCount();
        }
        showCartToast("Quantity updated", "success");
      }
      return;
    }

    // ✅ Logged in: Use CartManager.updateQuantity which calls /cart/update
    if (window.cartManager) {
      const item = window.cartManager.items.find(
        (i) => i.productId === cleanProductId,
      );
      if (!item) return;

      const newQty = Math.max(0, (item.quantity || 1) - 1);

      if (newQty === 0) {
        await window.cartManager.remove(cleanProductId);
        showCartToast("Item removed", "success");
      } else {
        // ✅ Call /cart/update endpoint
        const response = await fetch("/cart/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId: cleanProductId, quantity: newQty }),
          credentials: "include",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to update");
        }

        await window.cartManager.fetchFromAPI();
        window.cartManager.render();
        window.cartManager.updateCartCount();
        showCartToast("Quantity updated", "success");
      }
    }
  } catch (error) {
    console.error("Decrease error:", error);
    showCartToast(error.message || "Failed to update", "error");
  } finally {
    if (button) button.disabled = false;
  }
}

/**
 * Integration with global addToCart from main.js
 */
async function updateCartFromGlobal(product, quantity = 1) {
  if (!cart) {
    // Guest mode
    const cartItems = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cartItems.find((item) => item.productId === product._id);

    if (existing) {
      existing.quantity += quantity;
    } else {
      cartItems.push({
        productId: product._id,
        title: product.title,
        price: product.price,
        image: product.images?.[0] || null,
        quantity: quantity,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cartItems));
    const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountEl = document.querySelector("#header-cart-count");
    if (cartCountEl) {
      cartCountEl.textContent = count;
      cartCountEl.style.display = count > 0 ? "flex" : "none";
    }
    return;
  }

  await cart.add(product, quantity);
}

// Toast notifications (same as main.js)
function showCartToast(message, type = "success") {
  const existing = document.getElementById("cart-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "cart-toast";
  toast.className = `cart-toast ${type}`;
  toast.style.cssText = `
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background: ${type === "success" ? "var(--success)" : "#ef4444"};
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

  const icon =
    type === "success"
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;

  toast.innerHTML = `${icon}<span>${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideOutRight 0.3s ease forwards";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Toast animations
if (!document.getElementById("cart-toast-styles")) {
  const style = document.createElement("style");
  style.id = "cart-toast-styles";
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

// ========================================
// PAYMENT METHOD TOGGLE
// ========================================
document.addEventListener("DOMContentLoaded", () => {
  const paymentRadios = document.querySelectorAll(
    'input[name="payment-method"]',
  );
  const cardDetailsForm = document.getElementById("card-details-form");

  function toggleCardForm() {
    const selected = document.querySelector(
      'input[name="payment-method"]:checked',
    )?.value;
    if (cardDetailsForm) {
      cardDetailsForm.style.display = selected === "card" ? "block" : "none";
    }
  }

  paymentRadios.forEach((radio) => {
    radio.addEventListener("change", toggleCardForm);
  });

  // Initialize on load
  toggleCardForm();

  // Format card number with spaces (basic UX enhancement)
  const cardNumberInput = document.getElementById("card-number");
  if (cardNumberInput) {
    cardNumberInput.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, ""); // Remove non-digits
      value = value.replace(/(.{4})/g, "$1 ").trim(); // Add space every 4 digits
      e.target.value = value;
    });
  }

  // Format expiry date as MM/YY
  const expiryInput = document.getElementById("card-expiry");
  if (expiryInput) {
    expiryInput.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "");
      if (value.length >= 2) {
        value = value.slice(0, 2) + "/" + value.slice(2, 4);
      }
      e.target.value = value;
    });
  }
});

// ========================================
// CHECKOUT LOGIC - cart.js
// ========================================

document.addEventListener("DOMContentLoaded", () => {
  // Only run on checkout page
  if (window.location.pathname !== "/cart/checkout") return;

  // Toggle payment form visibility
  const paymentRadios = document.querySelectorAll(
    'input[name="payment-method"]',
  );
  const cardDetailsForm = document.getElementById("card-details-form");

  paymentRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (cardDetailsForm) {
        cardDetailsForm.style.display =
          radio.value === "card" ? "block" : "none";
      }
    });
  });

  // Format card inputs
  const cardNumber = document.getElementById("card-number");
  const cardExpiry = document.getElementById("card-expiry");

  if (cardNumber) {
    cardNumber.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "");
      value = value.replace(/(.{4})/g, "$1 ").trim();
      e.target.value = value;
    });
  }

  if (cardExpiry) {
    cardExpiry.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "");
      if (value.length >= 2) {
        value = value.slice(0, 2) + "/" + value.slice(2, 4);
      }
      e.target.value = value;
    });
  }

  // Place order handler (demo mode)
  const placeOrderBtn = document.getElementById("placeOrderBtn");
  const comingSoonOverlay = document.getElementById("comingSoonOverlay");
  const continueToConfirmation = document.getElementById(
    "continueToConfirmation",
  );

  if (placeOrderBtn && comingSoonOverlay) {
    placeOrderBtn.addEventListener("click", () => {
      comingSoonOverlay.style.display = "flex";
    });
  }

  if (continueToConfirmation) {
    continueToConfirmation.addEventListener("click", () => {
      // Demo: clear cart and redirect
      if (!localStorage.getItem("jwtToken")) {
        localStorage.removeItem("cart");
      }
      window.location.href = "/order/confirmation?demo=true";
    });
  }
});

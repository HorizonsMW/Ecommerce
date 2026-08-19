// Product detail page functionality
function changeMainImage(imageUrl) {
  document.getElementById("mainProductImage").src = imageUrl;
}
// Helper: Get total pages by counting pagination number buttons
function getTotalPagesFromDOM() {
  const pageButtons = document.querySelectorAll(".pagination-number");
  // console.log(`From array, pages is ${pageButtons.length}`);
  return pageButtons.length;
}
// Helper: Get current page from the active button
function getCurrentPageFromDOM() {
  const activeBtn = document.querySelector(".pagination-number.active");
  console.log(
    `Active page from DOM is ${activeBtn ? parseInt(activeBtn.dataset.page) : 1}`,
  );
  return activeBtn ? parseInt(activeBtn.dataset.page) : 1;
}

function navigateToPage(page) {
  // Get current state from DOM
  const totalPages = getTotalPagesFromDOM();

  // Validate page bounds
  if (page < 1 || page > totalPages) {
    console.warn(`⚠️ Invalid page: ${page} (valid: 1-${totalPages})`);
    return;
  }

  // Build new URL preserving all existing params
  const url = new URL(window.location);
  url.searchParams.set("page", page.toString());

  // Navigate (reload)
  window.location.href = url.toString();
}
const accordionHeaders = document.querySelectorAll(".filter-accordion-header");
// Products page functionality
document.addEventListener("DOMContentLoaded", function () {
  const viewButtons = document.querySelectorAll(".view-button");
  const productsGrid = document.querySelector(".products-grid");
  const sortSelect = document.querySelector(".sort-select");
  const filterToggle = document.getElementById("filterToggle");
  const filtersColumn = document.querySelector(".filters-column");
  const filterOkButton = document.querySelector(".filter-ok-button");
  const filterResetButton = document.querySelector(".filter-reset-button");
  const allProducts = Array.from(document.querySelectorAll(".product-card"));
  const accountButton = document.getElementById("account-icon");

  // ========================================
  // SERVER-SIDE PAGINATION (URL-Based)
  // ========================================

  // Get pagination elements
  const paginationNumbers = document.getElementById("paginationNumbers");
  const prevButton = document.getElementById("prevPage");
  const nextButton = document.getElementById("nextPage");

  // Read current state from EJS-rendered data attributes or global vars
  var currentPage = parseInt(getCurrentPageFromDOM() || "1");
  const totalPages = parseInt(getTotalPagesFromDOM() || "1");
  console.log(`📄 Pagination: Page ${currentPage} of ${totalPages}`);

  // Profile actions
  if (accountButton) {
    accountButton.addEventListener("click", (e) => {
      e.preventDefault();

      // 🔍 Check if user has a token (client-side pre-check)
      const token =
        localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");

      if (token) {
        // ✅ User appears logged in → redirect to profile
        // The isLoggedIn middleware will validate the token server-side
        window.location.href = "/user/profile";
      } else {
        // ❌ No token found → redirect to login
        console.log("No auth token found, redirecting to login");
        window.location.href = "/user/login";
      }
    });
  }

  // Reset filters
  // In main.js, update filterResetButton listener:
  let overlay = document.querySelector(".filters-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "filters-overlay";
    document.body.appendChild(overlay);
  }

  if (filterResetButton) {
    filterResetButton.addEventListener("click", function (e) {
      e.preventDefault();

      // Build clean URL with only sort param (reset filters)
      const url = new URL(window.location);

      // Remove all filter params
      ["category", "price", "brand", "color", "availability"].forEach(
        (param) => {
          url.searchParams.delete(param);
        },
      );

      // Keep current sort, reset to page 1
      const currentSort = sortSelect?.value || "newest";
      url.searchParams.set("sort", currentSort);
      url.searchParams.set("page", "1");

      // Redirect to reload unfiltered
      console.log("🔄 Resetting filters, redirecting to:", url.toString());
      window.location.href = url.toString();

      console.log("🔍 Filter comparison debug:", {
        selectedCategories, // From req.query
        availableCategories: filtersColumn.categories.map((c) => c.name), // From DB
        matches: selectedCategories.map((sel) =>
          filtersColumn.categories.some((cat) => cat.name === sel),
        ),
      });
    });
  }

  // Filter toggle functionality
  if (filterToggle) {
    filterToggle.addEventListener("click", function () {
      //console.log("clicked filterToggle");
      filtersColumn.classList.add("active");
    });
  }

  // Close filters when clicking outside
  if (filtersColumn) {
    document.addEventListener("click", function (event) {
      if (
        !filtersColumn.contains(event.target) &&
        !filterToggle.contains(event.target)
      ) {
        filtersColumn.classList.remove("active");
      }
    });
  }
  // filterOkButton listener:

  if (filterOkButton) {
    filterOkButton.addEventListener("click", function (e) {
      e.preventDefault();

      // Build URL params from checked filters
      const urlParams = new URLSearchParams();

      // Categories
      const selectedCategories = Array.from(
        document.querySelectorAll('input[name="category"]:checked'),
      ).map((cb) => cb.value);

      if (selectedCategories.length > 0) {
        selectedCategories.forEach((cat) => urlParams.append("category", cat));
      }

      // Price ranges
      const selectedPrices = Array.from(
        document.querySelectorAll('input[name="price"]:checked'),
      ).map((cb) => cb.value);

      if (selectedPrices.length > 0) {
        selectedPrices.forEach((price) => urlParams.append("price", price));
      }

      // Brands
      const selectedBrands = Array.from(
        document.querySelectorAll('input[name="brand"]:checked'),
      ).map((cb) => cb.value);

      if (selectedBrands.length > 0) {
        selectedBrands.forEach((brand) => urlParams.append("brand", brand));
      }

      // Colors
      const selectedColors = Array.from(
        document.querySelectorAll('input[name="color"]:checked'),
      ).map((cb) => cb.value);

      if (selectedColors.length > 0) {
        selectedColors.forEach((color) => urlParams.append("color", color));
      }

      // Availability
      const selectedAvailability = Array.from(
        document.querySelectorAll('input[name="availability"]:checked'),
      ).map((cb) => cb.value);

      if (selectedAvailability.length > 0) {
        selectedAvailability.forEach((avail) =>
          urlParams.append("availability", avail),
        );
      }

      // Preserve current sort and reset to page 1
      const currentSort = sortSelect?.value || "newest";
      urlParams.set("sort", currentSort);
      urlParams.set("page", "1"); // Always reset to first page when filtering

      // Build new URL
      const url = new URL(window.location);
      url.search = urlParams.toString();

      // Redirect to reload with server-side filtering
      console.log("🔍 Applying filters, redirecting to:", url.toString());
      window.location.href = url.toString();
    });
  }

  // View switching functionality
  if (viewButtons) {
    viewButtons.forEach((button) => {
      button.addEventListener("click", function () {
        viewButtons.forEach((btn) => btn.classList.remove("active"));
        this.classList.add("active");
        productsGrid.setAttribute("data-view", this.dataset.view);
      });
    });
  }

  /*  // Sorting functionality - limitation - sorting only displayed products. New sort fixes this
  if (sortSelect) {
    sortSelect.addEventListener("change", function () {
      const products = Array.from(document.querySelectorAll(".product-card"));
      const sortValue = this.value;

      products.sort((a, b) => {
        switch (sortValue) {
          case "price-low":
            return (
              parseFloat(
                a.querySelector(".product-price").textContent.match(/\d+/)[0],
              ) -
              parseFloat(
                b.querySelector(".product-price").textContent.match(/\d+/)[0],
              )
            );
          case "price-high":
            return (
              parseFloat(
                b.querySelector(".product-price").textContent.match(/\d+/)[0],
              ) -
              parseFloat(
                a.querySelector(".product-price").textContent.match(/\d+/)[0],
              )
            );
          case "name-asc":
            return a
              .querySelector(".product-title")
              .textContent.trim()
              .localeCompare(
                b.querySelector(".product-title").textContent.trim(),
              );
          case "name-desc":
            return b
              .querySelector(".product-title")
              .textContent.trim()
              .localeCompare(
                a.querySelector(".product-title").textContent.trim(),
              );
          case "newest":
            return new Date(b.dataset.date) - new Date(a.dataset.date);
          case "oldest":
            return new Date(a.dataset.date) - new Date(b.dataset.date);
          default:
            return 0;
        }
      });

      products.forEach((product) => productsGrid.appendChild(product));
    });
  } */

  // New sort functionality

  // Sorting functionality - SERVER-SIDE via URL params
  if (sortSelect) {
    sortSelect.addEventListener("change", function () {
      const sortValue = this.value;
      if (!sortValue) return; // Ignore empty selection

      // Build new URL with sort param, reset to page 1
      const url = new URL(window.location);
      url.searchParams.set("sort", sortValue);
      url.searchParams.set("page", "1"); // Reset to first page when sorting

      // Preserve existing filter params if any
      // (filters are already in URL if you implemented dynamic filters)

      // Redirect to reload with new sort
      window.location.href = url.toString();
    });
  }

  function updatePagination() {
    if (!paginationNumbers) return;
    const productsPerPage = 12;

    const products = Array.from(document.querySelectorAll(".product-card"));
    const totalPages = Math.ceil(products.length / productsPerPage);

    // Update pagination numbers
    paginationNumbers.innerHTML = "";
    for (let i = 1; i <= totalPages; i++) {
      const pageButton = document.createElement("button");
      pageButton.className = `pagination-number ${
        i === currentPage ? "active" : ""
      }`;
      pageButton.textContent = i;
      pageButton.addEventListener("click", () => goToPage(i));
      paginationNumbers.appendChild(pageButton);
    }

    // Update prev/next buttons
    if (prevButton) prevButton.disabled = currentPage === 1;
    if (nextButton) nextButton.disabled = currentPage === totalPages;

    // Show only products for current page
    products.forEach((product, index) => {
      const startIndex = (currentPage - 1) * productsPerPage;
      const endIndex = startIndex + productsPerPage;
      product.style.display =
        index >= startIndex && index < endIndex ? "" : "none";
    });
  }
  ///
  /* COMMENT ALL OLD PAGINATION FUNCTIONS
  // Pagination functionality - old pagination - not in use - after implement server side sorting where products span multiple pages
  const productsPerPage = 10;
  const paginationNumbers = document.getElementById("paginationNumbers");
  const prevButton = document.getElementById("prevPage");
  const nextButton = document.getElementById("nextPage");
  let currentPage = 1;

  function updatePagination() {
    if (!paginationNumbers) return;

    const products = Array.from(document.querySelectorAll(".product-card"));
    const totalPages = Math.ceil(products.length / productsPerPage);

    // Update pagination numbers
    paginationNumbers.innerHTML = "";
    for (let i = 1; i <= totalPages; i++) {
      const pageButton = document.createElement("button");
      pageButton.className = `pagination-number ${
        i === currentPage ? "active" : ""
      }`;
      pageButton.textContent = i;
      pageButton.addEventListener("click", () => goToPage(i));
      paginationNumbers.appendChild(pageButton);
    }

    // Update prev/next buttons
    if (prevButton) prevButton.disabled = currentPage === 1;
    if (nextButton) nextButton.disabled = currentPage === totalPages;

    // Show only products for current page
    products.forEach((product, index) => {
      const startIndex = (currentPage - 1) * productsPerPage;
      const endIndex = startIndex + productsPerPage;
      product.style.display =
        index >= startIndex && index < endIndex ? "" : "none";
    });
  }

  // all old pagination commented
  function goToPage(page) {
    currentPage = page;
    updatePagination();
    // Scroll to top of products section
    const productsGrid = document.querySelector(".products-grid");
    if (productsGrid) {
      productsGrid.scrollIntoView({ behavior: "smooth" });
    }
  };  */
  /*
  if (prevButton) {
    prevButton.addEventListener("click", () => {
      if (currentPage > 1) {
        goToPage(currentPage - 1);
      }
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      const totalPages = Math.ceil(
        document.querySelectorAll(".product-card").length / productsPerPage,
      );
      if (currentPage < totalPages) {
        goToPage(currentPage + 1);
      }
    });
  }

  // Initialize pagination if elements exist
  if (paginationNumbers) {
    updatePagination();
  } */

  //begining of new pagination

  // Add event listeners
  if (prevButton) {
    prevButton.addEventListener("click", (e) => {
      e.preventDefault();
      if (currentPage > 1) {
        page = currentPage - 1;
        navigateToPage(page);
      }
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", (e) => {
      e.preventDefault();
      if (currentPage < totalPages) {
        page = currentPage + 1;
        navigateToPage(page);
      }
    });
    // Add listeners to page number buttons
    paginationNumbers.querySelectorAll(".pagination-number").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log(
          `Page number works? Current page is ${currentPage}, total pages ${totalPages}`,
        );
        const page = parseInt(btn.dataset.page);
        //console.log(page);
        if (page && page !== currentPage) {
          // navigate to page
          // Build new URL preserving all existing params except page
          const url = new URL(window.location);
          url.searchParams.set("page", page.toString());
          // Option A: Simple reload (recommended for SEO + simplicity)
          window.location.href = url.toString();
        }
      });
    });
  }
});

// Add this helper function at the top of your DOMContentLoaded block
// or outside the event listener for reusability

function normalizeCategory(category) {
  if (!category) return "";
  const lower = category.toLowerCase().trim();

  // Map singular filter values to plural database values
  const mapping = {
    smartphone: "smartphones",
    tablet: "tablets",
    laptop: "laptops",
    smartwatch: "smartwatches",
    headphone: "headphones",
    earbud: "earbuds",
    accessory: "accessories",
  };

  return mapping[lower] || lower;
}
// Mobile Filters Toggle - for products// Mobile Filters Toggle - FIXED to prevent duplicate overlays
document.addEventListener("DOMContentLoaded", () => {
  const filterToggle = document.getElementById("filterToggle");
  const filtersColumn = document.querySelector(".filters-column");
  const filterOkButton = document.querySelector(".filter-ok-button");
  const filterResetButton = document.querySelector(".filter-reset-button");

  // ✅ Create overlay ONCE, only if it doesn't exist
  let overlay = document.querySelector(".filters-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "filters-overlay";
    document.body.appendChild(overlay);
  }

  // Toggle filters on mobile
  if (filterToggle && filtersColumn) {
    filterToggle.addEventListener("click", () => {
      filtersColumn.classList.add("active");
      overlay.classList.add("active");

      // ✅ Ensure filters-column can scroll independently
      filtersColumn.style.overflowY = "auto";
      filtersColumn.style.pointerEvents = "auto";
    });
  }

  // Close filters when clicking OK, Reset, or overlay
  const closeFilters = () => {
    filtersColumn?.classList.remove("active");
    overlay?.classList.remove("active");
    document.body.style.overflow = "";
  };

  filterOkButton?.addEventListener("click", closeFilters);
  filterResetButton?.addEventListener("click", closeFilters);
  overlay?.addEventListener("click", closeFilters);

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && filtersColumn?.classList.contains("active")) {
      closeFilters();
    }
  });

  // ... rest of your existing DOMContentLoaded code ...
}); //products functions end

// ========================================
// BOTTOM NAV: AUTO-ACTIVE LINK
// ========================================

document.addEventListener("DOMContentLoaded", () => {
  // Get current path (e.g., "/products", "/", "/user/profile")
  const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
  console.log("🔍 Nav debug:", {
    currentPath,
    activeLink: document.querySelector(".bottom-nav-link.active")?.href,
  });

  // Get all bottom nav links
  const navLinks = document.querySelectorAll(".bottom-nav-link");

  navLinks.forEach((link) => {
    // Get link's href path (also normalize trailing slash)
    const linkPath = link.getAttribute("href")?.replace(/\/$/, "") || "/";

    // Check for exact match OR if current path starts with link path (for nested routes)
    if (currentPath === linkPath || currentPath.startsWith(linkPath + "/")) {
      // Remove active from all, add to this one
      navLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
    }
  });
});

/// Night day theme toggle
// In main.js
document.getElementById("themeToggle")?.addEventListener("click", () => {
  document.documentElement.setAttribute(
    "data-theme",
    document.documentElement.getAttribute("data-theme") === "dark"
      ? "light"
      : "dark",
  );
});

// In main.js - Add Scroll Progress Indicator
window.addEventListener("scroll", () => {
  const scrollProgress = document.querySelector(".scroll-progress");
  if (scrollProgress) {
    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    scrollProgress.style.width = `${(scrollTop / scrollHeight) * 100}%`;
  }
});

// ========================================
// CART FUNCTIONALITY - GLOBAL (main.js)
// ========================================
// ========================================
// CART FUNCTIONALITY - GLOBAL (main.js)
// ========================================

/**
 * Add product to cart with visual feedback
 * Redirects to login if user is not authenticated
 * @param {Object} product - Product data {_id, title, price, image, quantity}
 * @param {HTMLElement} button - The clicked add-to-cart button
 */
async function addToCart(product, button = null) {
  console.log("🛒 addToCart called:", { product, button: !!button }); // Debug log

  // Prevent duplicate clicks
  if (button) {
    button.disabled = true;
    const originalContent = button.innerHTML;
    button.innerHTML = '<span class="btn-loader">Adding...</span>';
  }

  try {
    // Check if user is logged in (has token)
    const token =
      localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");
    console.log("🔑 Token check:", !!token);

    if (!token) {
      // ❌ Not logged in: Redirect to login with return URL
      showCartToast(product.title, "Please login to add to cart", "error");
      // Delay redirect slightly so user sees the toast
      setTimeout(() => {
        const returnUrl = encodeURIComponent(
          window.location.pathname + window.location.search,
        );
        window.location.href = `/user/login?redirect=${returnUrl}&action=add-to-cart&productId=${product._id}`;
      }, 1500);

      if (window.location.pathname === "/user/login") {
        showCartToast(product.title, "Please login to add to cart", "error");
        return;
      }

      return;
    }

    // ✅ Logged in: Proceed with API call
    const response = await fetch("/cart/add", {
      // ← Changed from /api/cart/add
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        productId: product._id,
        quantity: 1,
      }),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to add to cart");
      // Prevent duplicate clicks
      if (button) {
        button.disabled = false;
        const originalContent = button.innerHTML;
        button.innerHTML = '<span class="btn-loader">Add to Cart</span>';
      }
    }

    const result = await response.json();

    updateCartCount(result.cartCount);
    showCartToast(product.title, `Added to cart!`);
    // Prevent duplicate clicks
    button.disabled = false;
    button.innerHTML = '<span class="btn-loader">Added, Add More</span>';
  } catch (error) {
    console.error("Add to cart error:", error);
    showCartToast(product.title, error.message || "Failed to add", "error");
  } finally {
    // Restore button state
    if (button) {
      button.disabled = false;
      if (button.querySelector(".btn-loader")) {
        button.innerHTML = originalContent;
      }
    }
  }
}

/**
 * Handle pending cart action AFTER successful login
 * Call this ONLY in the login success handler, NOT on page load
 */
async function handlePendingCartAction() {
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get("action");
  const productId = urlParams.get("productId");

  // ✅ Only proceed if we have valid pending action params
  if (action === "add-to-cart" && productId) {
    // ✅ Clear params immediately to prevent re-triggering
    window.history.replaceState({}, document.title, window.location.pathname);

    try {
      // ✅ Fetch product details
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) throw new Error("Product not found");

      const product = await response.json();

      // ✅ Call addToCart (user should now be logged in at this point)
      await addToCart(product);

      // ✅ Optional: Redirect back to original page after adding
      const redirect = urlParams.get("redirect");
      if (redirect) {
        window.location.href = decodeURIComponent(redirect);
      }
    } catch (error) {
      console.error("Failed to complete pending cart action:", error);
      showCartToast("Product", "Could not add to cart", "error");
    }
  }
}

/**
 * Update cart count badge in header
 */
function updateCartCount(count) {
  const cartCountEl = document.querySelector(".cart-count");
  if (cartCountEl) {
    cartCountEl.textContent = count;
    cartCountEl.style.display = count > 0 ? "flex" : "none";

    // Animate badge
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

/**
 * Show toast notification for cart actions
 */
function showCartToast(productName, message, type = "success") {
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

  toast.innerHTML = `${icon}<span><strong>${escapeHtml(productName)}</strong><br>${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideOutRight 0.3s ease forwards";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return "";
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * ✅ CRITICAL: Initialize cart event delegation
 * This is what makes the buttons clickable!
 */
function initCart() {
  //console.log("🛒 initCart() called"); // Debug log
  // Update cart count on load (for guest users)
  if (
    !localStorage.getItem("jwtToken") &&
    !sessionStorage.getItem("jwtToken")
  ) {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    updateCartCount(count);
  }

  // ✅ Delegate click events for .add-to-cart buttons (works for dynamically loaded content)
  document.addEventListener("click", (e) => {
    const button = e.target.closest(".add-to-cart");

    if (!button) {
      // console.log('❌ Click not on .add-to-cart'); // Uncomment for debugging
      return;
    }

    if (button.disabled) {
      console.log("⚠️ Button disabled");
      return;
    }

    //console.log("Add to cart button clicked"); // Debug log
    e.preventDefault();

    // Find product data from closest .product-card or .related-product-card
    const card = button.closest(".product-card, .related-product-card");
    if (!card) {
      console.error("❌ Could not find product card");
      return;
    }

    // Extract product data from data attributes (MOST RELIABLE)
    const product = {
      _id: card.dataset.productId,
      title:
        card.dataset.productTitle ||
        card.querySelector(".product-title")?.textContent?.trim(),
      price:
        parseFloat(card.dataset.productPrice) ||
        parseFloat(
          card.querySelector(".product-price")?.textContent?.replace("$", ""),
        ) ||
        0,
      images: [
        card.dataset.productImage || card.querySelector(".product-image")?.src,
      ].filter(Boolean),
      quantity: parseInt(card.dataset.productQuantity) || 1,
      brand: card.dataset.productBrand,
      color: card.dataset.productColor,
    };

    //console.log("📦 Extracted product:", product); // Debug log

    if (!product._id || !product.title) {
      console.error("❌ Missing product data", { card, product });
      showCartToast("Error", "Could not add product", "error");
      return;
    }

    // Call global addToCart function
    addToCart(product, button);
  });
}

// ✅ Initialize cart when DOM is ready - THIS IS CRITICAL!
document.addEventListener("DOMContentLoaded", () => {
  console.log("📄 DOMContentLoaded - initializing cart");
  initCart();
});

// ✅ Only call handlePendingCartAction AFTER successful login in your login form handler

// Add toast animations to document head
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

// Fetch and update cart count for logged-in users
async function updateHeaderCartCount() {
  const token =
    localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");
  const badge = document.getElementById("header-cart-count");

  if (!badge || !token) {
    // Guest: count from localStorage
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? "flex" : "none";
    }
    return;
  }

  try {
    // ✅ Fetch from /cart/items (not /cart/cart)
    const response = await fetch("/cart/items", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      const count =
        data.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

      if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? "flex" : "none";
      }
    }
  } catch (error) {
    console.warn("Could not fetch cart count:", error);
  }
}

// Update on page load
document.addEventListener("DOMContentLoaded", updateHeaderCartCount);

// Make available globally for cart.js to call after updates
window.updateHeaderCartCount = updateHeaderCartCount;

// END OF CART
// =======================================

// ========================================
// FILTER ACCORDION TOGGLE
// ========================================

accordionHeaders.forEach((header) => {
  header.addEventListener("click", () => {
    const content = header.nextElementSibling;
    const isExpanded = header.getAttribute("aria-expanded") === "true";

    // Toggle this accordion
    header.setAttribute("aria-expanded", !isExpanded);
    content.style.display = isExpanded ? "none" : "block";

    // Optional: Close other accordions (uncomment for "only one open" behavior)

    accordionHeaders.forEach((otherHeader) => {
      if (otherHeader !== header) {
        otherHeader.setAttribute("aria-expanded", "false");
        otherHeader.nextElementSibling.style.display = "none";
      }
    });
  });
});

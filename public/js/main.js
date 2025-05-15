// Product detail page functionality
function changeMainImage(imageUrl) {
  document.getElementById("mainProductImage").src = imageUrl;
}

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
  const cartButton = document.getElementById("cart-icon");

  // Profile actions
  if (accountButton) {
    accountButton.addEventListener("click", async () => {
      try {
        const response = await fetch("/user/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Assuming you store the JWT in localStorage
          },
        });

        if (response.ok) {
          const userData = await response.json();
          console.log("User is logged in:", userData);
          window.location.href = "/user/profile";
        } else {
          console.log("User is not logged in or session expired.");
          window.location.href = "/user/login";
        }
      } catch (error) {
        console.error("Error checking user status:", error);
      }
    });
  }

  // Cart actions
  if (cartButton) {
    cartButton.addEventListener("click", () => {
      console.log("Cart clicked");
    });
  }
  // Reset filters
  if (filterResetButton) {
    filterResetButton.addEventListener("click", function () {
      // Get current sort value
      const currentSort = sortSelect ? sortSelect.value : "newest";

      // Uncheck all checkboxes
      document
        .querySelectorAll('.filter-options input[type="checkbox"]')
        .forEach((checkbox) => {
          checkbox.checked = false;
        });

      // Reset products display
      productsGrid.innerHTML = "";
      allProducts.forEach((product) => productsGrid.appendChild(product));

      // Close filter panel on mobile
      if (window.innerWidth <= 768) {
        filtersColumn.classList.remove("active");
      }

      // Apply current sort to reset products
      if (sortSelect) {
        sortSelect.value = currentSort;
        const products = Array.from(document.querySelectorAll(".product-card"));

        products.sort((a, b) => {
          switch (currentSort) {
            case "price-low":
              return (
                parseFloat(
                  a.querySelector(".product-price").textContent.match(/\d+/)[0]
                ) -
                parseFloat(
                  b.querySelector(".product-price").textContent.match(/\d+/)[0]
                )
              );
            case "price-high":
              return (
                parseFloat(
                  b.querySelector(".product-price").textContent.match(/\d+/)[0]
                ) -
                parseFloat(
                  a.querySelector(".product-price").textContent.match(/\d+/)[0]
                )
              );
            case "name-asc":
              return a
                .querySelector(".product-title")
                .textContent.trim()
                .localeCompare(
                  b.querySelector(".product-title").textContent.trim()
                );
            case "name-desc":
              return b
                .querySelector(".product-title")
                .textContent.trim()
                .localeCompare(
                  a.querySelector(".product-title").textContent.trim()
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
      }

      // Reset pagination
      currentPage = 1;
      updatePagination();
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

  // Apply filters when OK button is clicked
  if (filterOkButton) {
    filterOkButton.addEventListener("click", function () {
      const selectedCategories = Array.from(
        document.querySelectorAll('input[name="category"]:checked')
      ).map((cb) => cb.value);
      const selectedPrices = Array.from(
        document.querySelectorAll('input[name="price"]:checked')
      ).map((cb) => cb.value);
      const selectedBrands = Array.from(
        document.querySelectorAll('input[name="brand"]:checked')
      ).map((cb) => cb.value);
      const selectedColors = Array.from(
        document.querySelectorAll('input[name="color"]:checked')
      ).map((cb) => cb.value);
      const selectedAvailability = Array.from(
        document.querySelectorAll('input[name="availability"]:checked')
      ).map((cb) => cb.value);

      // Get current sort value
      const currentSort = sortSelect ? sortSelect.value : "newest";

      // Filter products based on selections
      const filteredProducts = allProducts.filter((product) => {
        const productCategory = product.dataset.category;
        const productPrice = parseFloat(product.dataset.price);
        const productBrand = product.dataset.brand;
        const productColor = product.dataset.color;
        const productQuantity = parseInt(product.dataset.quantity);

        // Check if product matches any selected category
        const categoryMatch =
          selectedCategories.length === 0 ||
          selectedCategories.includes(productCategory);

        // Check if product price is within any selected range
        const priceMatch =
          selectedPrices.length === 0 ||
          selectedPrices.some((range) => {
            if (range === "2000+") {
              return productPrice >= 2000;
            }
            const [min, max] = range.split("-").map(Number);
            return productPrice >= min && productPrice <= max;
          });

        // Check if product brand matches any selected brand
        const brandMatch =
          selectedBrands.length === 0 || selectedBrands.includes(productBrand);

        // Check if product color matches any selected color
        const colorMatch =
          selectedColors.length === 0 || selectedColors.includes(productColor);

        // Check availability
        const availabilityMatch =
          selectedAvailability.length === 0 ||
          selectedAvailability.some((avail) => {
            if (avail === "in-stock") return productQuantity > 0;
            if (avail === "low-stock")
              return productQuantity > 0 && productQuantity <= 10;
            return true;
          });

        return (
          categoryMatch &&
          priceMatch &&
          brandMatch &&
          colorMatch &&
          availabilityMatch
        );
      });

      // Clear current products
      productsGrid.innerHTML = "";

      // Add filtered products
      if (filteredProducts.length > 0) {
        filteredProducts.forEach((product) =>
          productsGrid.appendChild(product)
        );
      } else {
        productsGrid.innerHTML =
          '<p class="no-products">No products match your filters.</p>';
      }

      // Close filter panel on mobile
      if (window.innerWidth <= 768) {
        filtersColumn.classList.remove("active");
      }

      // Apply current sort to filtered products
      if (sortSelect) {
        sortSelect.value = currentSort;
        const products = Array.from(document.querySelectorAll(".product-card"));

        products.sort((a, b) => {
          switch (currentSort) {
            case "price-low":
              return (
                parseFloat(
                  a.querySelector(".product-price").textContent.match(/\d+/)[0]
                ) -
                parseFloat(
                  b.querySelector(".product-price").textContent.match(/\d+/)[0]
                )
              );
            case "price-high":
              return (
                parseFloat(
                  b.querySelector(".product-price").textContent.match(/\d+/)[0]
                ) -
                parseFloat(
                  a.querySelector(".product-price").textContent.match(/\d+/)[0]
                )
              );
            case "name-asc":
              return a
                .querySelector(".product-title")
                .textContent.trim()
                .localeCompare(
                  b.querySelector(".product-title").textContent.trim()
                );
            case "name-desc":
              return b
                .querySelector(".product-title")
                .textContent.trim()
                .localeCompare(
                  a.querySelector(".product-title").textContent.trim()
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
      }

      // Reset pagination
      currentPage = 1;
      updatePagination();
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

  // Sorting functionality
  if (sortSelect) {
    sortSelect.addEventListener("change", function () {
      const products = Array.from(document.querySelectorAll(".product-card"));
      const sortValue = this.value;

      products.sort((a, b) => {
        switch (sortValue) {
          case "price-low":
            return (
              parseFloat(
                a.querySelector(".product-price").textContent.match(/\d+/)[0]
              ) -
              parseFloat(
                b.querySelector(".product-price").textContent.match(/\d+/)[0]
              )
            );
          case "price-high":
            return (
              parseFloat(
                b.querySelector(".product-price").textContent.match(/\d+/)[0]
              ) -
              parseFloat(
                a.querySelector(".product-price").textContent.match(/\d+/)[0]
              )
            );
          case "name-asc":
            return a
              .querySelector(".product-title")
              .textContent.trim()
              .localeCompare(
                b.querySelector(".product-title").textContent.trim()
              );
          case "name-desc":
            return b
              .querySelector(".product-title")
              .textContent.trim()
              .localeCompare(
                a.querySelector(".product-title").textContent.trim()
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
  }

  // Pagination functionality
  const productsPerPage = 12;
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

  function goToPage(page) {
    currentPage = page;
    updatePagination();
    // Scroll to top of products section
    const productsGrid = document.querySelector(".products-grid");
    if (productsGrid) {
      productsGrid.scrollIntoView({ behavior: "smooth" });
    }
  }

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
        document.querySelectorAll(".product-card").length / productsPerPage
      );
      if (currentPage < totalPages) {
        goToPage(currentPage + 1);
      }
    });
  }

  // Initialize pagination if elements exist
  if (paginationNumbers) {
    updatePagination();
  }

  /*// Sort products by newest first on page load
    if (sortSelect) {
        sortSelect.value = 'newest';
        const products = Array.from(document.querySelectorAll('.product-card'));
        
        products.sort((a, b) => {
            return new Date(b.dataset.date) - new Date(a.dataset.date);
        });

        products.forEach(product => productsGrid.appendChild(product));
        updatePagination();
    }*/ //Resolved using getAllProductsSorted instead of getAllProducts
});

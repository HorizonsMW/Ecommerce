// ========================================
// ADDRESSES MANAGEMENT - addresses.js
// Handles CRUD operations with password verification
// ========================================

class AddressManager {
  constructor() {
    this.API_BASE = `http://${window.location.hostname}:4000`;
    this.addresses = [];
    this.pendingAction = null; // Stores action awaiting password verification
  }

  // 🔐 Get auth headers for API calls
  getAuthHeaders() {
    const token =
      localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // 📦 Generic API request helper
  async request(url, options = {}) {
    const response = await fetch(url, {
      credentials: "include",
      headers: this.getAuthHeaders(),
      ...options,
    });

    if (response.status === 401) {
      // Token expired → redirect to login
      localStorage.removeItem("jwtToken");
      sessionStorage.removeItem("jwtToken");
      window.location.href =
        "/user/login?redirect=" + encodeURIComponent(window.location.pathname);
      return null;
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // 🔄 Fetch user addresses from backend
  async fetchAddresses() {
    try {
      const data = await this.request(`${this.API_BASE}/user/addresses`, {
        method: "GET",
      });
      this.addresses = data.addresses || [];
      return this.addresses;
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
      return [];
    }
  }

  // 🎨 Render addresses to DOM
  render() {
    const list = document.getElementById("addressesList");
    const noAddresses = document.getElementById("noAddresses");

    if (!list) return;

    if (this.addresses.length === 0) {
      if (noAddresses) noAddresses.style.display = "block";
      list.innerHTML = "";
      return;
    }

    if (noAddresses) noAddresses.style.display = "none";

    list.innerHTML = this.addresses
      .map(
        (addr) => `
      <div class="address-card ${addr.isDefault ? "default" : ""}" data-address-id="${addr._id}">
        ${addr.isDefault ? '<span class="default-badge">Default</span>' : ""}
        
        <div class="address-card-header">
          <h5 class="address-card-title">${addr.label || "Address"} ${addr.isDefault ? "• Default" : ""}</h5>
          <div class="address-card-actions">
            <button class="edit-address-btn" data-id="${addr._id}">✏️ Edit</button>
            <button class="delete-address-btn delete-btn" data-id="${addr._id}">🗑️ Delete</button>
          </div>
        </div>
        
        <div class="address-card-body">
          <p><strong>${addr.name}</strong></p>
          <p>${addr.line1}${addr.line2 ? `<br>${addr.line2}` : ""}</p>
          <p>${addr.city}, ${addr.state} ${addr.postal}</p>
          <p>${addr.country}</p>
          <p>📱 ${addr.phone}</p>
        </div>
      </div>
    `,
      )
      .join("");

    // Add event listeners to buttons
    list.querySelectorAll(".edit-address-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = e.currentTarget.dataset.id;
        this.editAddress(id);
      });
    });

    list.querySelectorAll(".delete-address-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = e.currentTarget.dataset.id;
        this.deleteAddress(id);
      });
    });
  }

  // ➕ Show modal to add new address
  showAddModal() {
    document.getElementById("addressModalTitle").textContent =
      "Add New Address";
    document.getElementById("addressForm").reset();
    document.getElementById("addressId").value = "";
    document.getElementById("addressModal").style.display = "flex";
  }

  // ✏️ Show modal to edit existing address
  async editAddress(addressId) {
    const address = this.addresses.find((a) => a._id === addressId);
    if (!address) return;

    document.getElementById("addressModalTitle").textContent = "Edit Address";
    document.getElementById("addressId").value = address._id;
    document.getElementById("addressLabel").value = address.label || "";
    document.getElementById("addressName").value = address.name || "";
    document.getElementById("addressLine1").value = address.line1 || "";
    document.getElementById("addressLine2").value = address.line2 || "";
    document.getElementById("addressCity").value = address.city || "";
    document.getElementById("addressState").value = address.state || "";
    document.getElementById("addressPostal").value = address.postal || "";
    document.getElementById("addressCountry").value = address.country || "";
    document.getElementById("addressPhone").value = address.phone || "";
    document.getElementById("addressDefault").checked =
      address.isDefault || false;

    document.getElementById("addressModal").style.display = "flex";
  }

  // 🗑️ Delete address (requires password verification)
  async deleteAddress(addressId) {
    if (!confirm("Are you sure you want to delete this address?")) return;

    // Store pending action and show password modal
    this.pendingAction = { type: "delete", addressId };
    this.showPasswordModal();
  }

  // 💾 Save address (add or update, requires password verification)
  async saveAddress(formData) {
    // Store pending action and show password modal
    this.pendingAction = { type: "save", formData };
    this.showPasswordModal();
  }

  // 🔐 Show password verification modal (reuses existing modal from profile.js)
  showPasswordModal() {
    const modal = document.getElementById("passwordModal");
    const passwordError = document.getElementById("passwordError");
    const verifyInput = document.getElementById("verifyPassword");

    if (passwordError) passwordError.style.display = "none";
    if (verifyInput) {
      verifyInput.value = "";
      verifyInput.focus();
    }
    if (modal) {
      modal.style.display = "flex";
      document.body.style.overflow = "hidden";
    }
  }

  // 🔐 Hide password modal
  hidePasswordModal() {
    const modal = document.getElementById("passwordModal");
    if (modal) {
      modal.style.display = "none";
      document.body.style.overflow = "";
    }
    this.pendingAction = null;
  }

  // ✅ Execute pending action after password verification
  async executePendingAction(password) {
    if (!this.pendingAction) return;

    const { type, addressId, formData } = this.pendingAction;

    try {
      // 🔐 Step 1: Verify password
      const verifyResponse = await fetch(
        `${this.API_BASE}/user/verify-password`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify({ password }),
        },
      );

      if (!verifyResponse.ok) {
        const err = await verifyResponse.json();
        throw new Error(err.message || "Password verification failed");
      }

      // ✅ Step 2: Execute the actual action
      if (type === "delete") {
        await this.request(`${this.API_BASE}/user/addresses/${addressId}`, {
          method: "DELETE",
        });
        showMessage("✅ Address deleted successfully", "success");
      } else if (type === "save") {
        const method = formData._id ? "PUT" : "POST";
        const url = formData._id
          ? `${this.API_BASE}/user/addresses/${formData._id}`
          : `${this.API_BASE}/user/addresses`;

        await this.request(url, {
          method,
          body: JSON.stringify(formData),
        });
        showMessage(
          formData._id ? "✅ Address updated" : "✅ Address added",
          "success",
        );
      }

      // ✅ Step 3: Refresh and re-render
      await this.fetchAddresses();
      this.render();
      this.hidePasswordModal();

      // Close address modal if open
      const addressModal = document.getElementById("addressModal");
      if (addressModal) addressModal.style.display = "none";
    } catch (error) {
      console.error("Address action failed:", error);
      const passwordError = document.getElementById("passwordError");
      if (passwordError) {
        passwordError.textContent =
          error.message || "Action failed. Please try again.";
        passwordError.style.display = "block";
      }
      throw error;
    }
  }

  // 🎯 Initialize: fetch and render addresses on load
  async init() {
    await this.fetchAddresses();
    this.render();
  }
}

// ========================================
// GLOBAL INSTANCE & INITIALIZATION
// ========================================
let addressManager;

document.addEventListener("DOMContentLoaded", async () => {
  // Only initialize on profile page
  if (window.location.pathname !== "/user/profile") return;

  addressManager = new AddressManager();
  await addressManager.init();
  window.addressManager = addressManager; // Expose globally for debugging

  // 🎯 Add Address Button
  const addBtn = document.getElementById("addAddressBtn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      addressManager.showAddModal();
    });
  }

  // 🎯 Address Modal Close Handlers
  const closeAddressModal = document.getElementById("closeAddressModal");
  const cancelAddressModal = document.getElementById("cancelAddressModal");
  const addressModal = document.getElementById("addressModal");

  [closeAddressModal, cancelAddressModal].forEach((btn) => {
    if (btn) {
      btn.addEventListener("click", () => {
        if (addressModal) addressModal.style.display = "none";
        document.body.style.overflow = "";
      });
    }
  });

  if (addressModal) {
    addressModal.addEventListener("click", (e) => {
      if (e.target === addressModal) {
        addressModal.style.display = "none";
        document.body.style.overflow = "";
      }
    });
  }

  // 💾 Save Address Button Handler
  const saveAddressBtn = document.getElementById("saveAddressBtn");
  if (saveAddressBtn) {
    saveAddressBtn.addEventListener("click", async () => {
      const formData = {
        _id: document.getElementById("addressId").value || undefined,
        label: document.getElementById("addressLabel").value.trim(),
        name: document.getElementById("addressName").value.trim(),
        line1: document.getElementById("addressLine1").value.trim(),
        line2: document.getElementById("addressLine2").value.trim(),
        city: document.getElementById("addressCity").value.trim(),
        state: document.getElementById("addressState").value.trim(),
        postal: document.getElementById("addressPostal").value.trim(),
        country: document.getElementById("addressCountry").value.trim(),
        phone: document.getElementById("addressPhone").value.trim(),
        isDefault: document.getElementById("addressDefault").checked,
      };

      // Basic validation
      if (
        !formData.name ||
        !formData.line1 ||
        !formData.city ||
        !formData.postal
      ) {
        showMessage("⚠️ Please fill in all required fields", "error");
        return;
      }

      // Show password verification before saving
      await addressManager.saveAddress(formData);
    });
  }

  // 🔐 Integrate with existing password modal confirm button
  const confirmPasswordVerify = document.getElementById(
    "confirmPasswordVerify",
  );
  if (confirmPasswordVerify) {
    // Store original handler to chain with address actions
    const originalHandler = confirmPasswordVerify.onclick;

    confirmPasswordVerify.addEventListener("click", async () => {
      const password = document.getElementById("verifyPassword")?.value;

      // If there's a pending address action, execute it
      if (addressManager?.pendingAction && password) {
        try {
          await addressManager.executePendingAction(password);
        } catch (error) {
          // Error already shown in executePendingAction
        }
      } else if (originalHandler) {
        // Fall back to original profile update handler
        originalHandler();
      }
    });
  }
});

// 🎨 Helper: Show message (reuse from profile.js if available)
function showMessage(text, type = "error") {
  // Try to use existing message box from profile.js
  const box = document.getElementById("messageBox");
  if (box) {
    box.textContent = text;
    box.className = `message-box ${type}`;
    box.style.display = "block";

    if (type === "success") {
      setTimeout(() => {
        box.style.display = "none";
      }, 4000);
    }
  } else {
    // Fallback: simple alert
    alert(`${type === "error" ? "❌" : "✅"} ${text}`);
  }
}

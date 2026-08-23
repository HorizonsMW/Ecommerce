// ========================================
// ADDRESSES MANAGEMENT - addresses.js
// ONLY runs on /user/profile, NO redirects
// ========================================

class AddressManager {
  constructor() {
    this.API_BASE = `http://${window.location.hostname}:4000/api`;
    this.addresses = [];
    this.pendingAction = null;
  }

  getAuthHeaders() {
    const token =
      localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // ✅ FIX: NO REDIRECTS - just throw error for caller to handle
  async request(url, options = {}) {
    const response = await fetch(url, {
      credentials: "include",
      headers: this.getAuthHeaders(),
      ...options,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      // ✅ Just throw - don't redirect
      throw new Error(err.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async fetchAddresses() {
    try {
      const data = await this.request(`${this.API_BASE}/user/addresses`, {
        method: "GET",
      });
      this.addresses = data?.addresses || [];
      return this.addresses;
    } catch (error) {
      // ✅ Log but don't crash
      console.warn("⚠️ Could not fetch addresses:", error.message);
      this.addresses = [];
      return [];
    }
  }

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
      .map((addr) => {
        const addressId = String(addr._id);
        return `
      <div class="address-card ${addr.isDefault ? "default" : ""}" data-address-id="${addressId}">
        ${addr.isDefault ? '<span class="default-badge">Default</span>' : ""}
        <div class="address-card-header">
          <h5 class="address-card-title">${addr.label || "Address"} ${addr.isDefault ? "• Default" : ""}</h5>
        </div>
        <div class="address-card-body">
          <p><strong>${addr.name}</strong></p>
          <p>${addr.line1}${addr.line2 ? `<br>${addr.line2}` : ""}</p>
          <p>${addr.city}, ${addr.state} ${addr.postal}</p>
          <p>${addr.country}</p>
          <p>📱 ${addr.phone}</p>
        </div>
        <div class="address-card-actions">
            <button class="edit-address-btn" data-id="${addressId}">✏️ Edit</button>
            <button class="delete-address-btn delete-btn" data-id="${addressId}">🗑️ Delete</button>
          </div>
      </div>`;
      })
      .join("");

    // Add accordion toggle for mobile
    list.querySelectorAll(".address-card").forEach((card) => {
      if (window.innerWidth <= 768) {
        const header = card.querySelector(".address-card-header");
        if (header) {
          header.style.cursor = "pointer";
          header.addEventListener("click", () => {
            card.classList.toggle("expanded");
          });
        }
      }
    });

    // Event listeners for edit/delete
    list.querySelectorAll(".edit-address-btn").forEach((btn) => {
      btn.addEventListener("click", (e) =>
        this.editAddress(e.currentTarget.dataset.id),
      );
    });
    list.querySelectorAll(".delete-address-btn").forEach((btn) => {
      btn.addEventListener("click", (e) =>
        this.deleteAddress(e.currentTarget.dataset.id),
      );
    });

    // ✅ FIX: Call updateAddressStats AFTER rendering
    this.updateAddressStats();
  }

  // After render(), update address count:
  updateAddressStats = () => {
    // ✅ Update address count in profile card
    const countEl = document.getElementById("addressCount");
    if (countEl) {
      countEl.textContent = this.addresses.length;
    }

    // ✅ Dispatch event for profile.js to listen
    document.dispatchEvent(
      new CustomEvent("addressesUpdated", {
        detail: { count: this.addresses.length },
      }),
    );
  };

  showAddModal() {
    const modal = document.getElementById("addressModal");
    const title = document.getElementById("addressModalTitle");
    const form = document.getElementById("addressForm");
    const idField = document.getElementById("addressId");

    if (!modal || !title || !form || !idField) return; // ✅ Safe exit

    title.textContent = "Add New Address";
    form.reset();
    idField.value = "";
    modal.style.display = "flex";
  }

  async editAddress(addressId) {
    const address = this.addresses.find(
      (a) => String(a._id) === String(addressId),
    );
    if (!address) return;

    const modal = document.getElementById("addressModal");
    const title = document.getElementById("addressModalTitle");
    const idField = document.getElementById("addressId");

    if (!modal || !title || !idField) return;

    title.textContent = "Edit Address";
    idField.value = address._id;

    // Safe setter helper
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || "";
    };

    setVal("addressLabel", address.label);
    setVal("addressName", address.name);
    setVal("addressLine1", address.line1);
    setVal("addressLine2", address.line2);
    setVal("addressCity", address.city);
    setVal("addressState", address.state);
    setVal("addressPostal", address.postal);
    setVal("addressCountry", address.country);
    setVal("addressPhone", address.phone);

    const defaultCheck = document.getElementById("addressDefault");
    if (defaultCheck) defaultCheck.checked = address.isDefault || false;

    modal.style.display = "flex";
  }

  async deleteAddress(addressId) {
    if (!confirm("Are you sure you want to delete this address?")) return;
    this.pendingAction = { type: "delete", addressId };
    this.showPasswordModal();
  }

  async saveAddress(formData) {
    this.pendingAction = { type: "save", formData };
    this.showPasswordModal();
  }

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
      document.body.style.overflow = "scroll";
    }
  }

  hidePasswordModal() {
    const modal = document.getElementById("passwordModal");
    if (modal) {
      modal.style.display = "none";
      document.body.style.overflow = "";
    }
    this.pendingAction = null;
  }

  async executePendingAction(password) {
    if (!this.pendingAction) return;
    const { type, addressId, formData } = this.pendingAction;

    try {
      // Verify password
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

      // Execute action
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
        await this.request(url, { method, body: JSON.stringify(formData) });
        showMessage(
          formData._id ? "✅ Address updated" : "✅ Address added",
          "success",
        );
      }

      // Refresh
      await this.fetchAddresses();
      this.render();
      this.hidePasswordModal();

      const addressModal = document.getElementById("addressModal");
      if (addressModal) addressModal.style.display = "none";
    } catch (error) {
      console.error("❌ Address action failed:", error.message);
      const passwordError = document.getElementById("passwordError");
      if (passwordError) {
        passwordError.textContent =
          error.message || "Action failed. Please try again.";
        passwordError.style.display = "block";
      }
      throw error;
    }
  }

  async init() {
    await this.fetchAddresses();
    this.render();
  }
}

// ========================================
// INITIALIZATION - ONLY ON /user/profile
// ========================================

document.addEventListener("DOMContentLoaded", async () => {
  // ✅ CRITICAL: Only run on profile page
  if (window.location.pathname !== "/user/profile") return;

  // ✅ Wait for addressesList to exist
  if (!document.getElementById("addressesList")) return;

  addressManager = new AddressManager();
  await addressManager.init();
  window.addressManager = addressManager;

  // Safe event bindings
  const addBtn = document.getElementById("addAddressBtn");
  if (addBtn)
    addBtn.addEventListener("click", () => addressManager?.showAddModal());

  const closeAddressModal = document.getElementById("closeAddressModal");
  const cancelAddressModal = document.getElementById("cancelAddressModal");
  const addressModal = document.getElementById("addressModal");

  [closeAddressModal, cancelAddressModal].forEach((btn) => {
    if (btn)
      btn.addEventListener("click", () => {
        if (addressModal) addressModal.style.display = "none";
        document.body.style.overflow = "";
      });
  });

  if (addressModal) {
    addressModal.addEventListener("click", (e) => {
      if (e.target === addressModal) {
        addressModal.style.display = "none";
        document.body.style.overflow = "";
      }
    });
  }

  const saveAddressBtn = document.getElementById("saveAddressBtn");
  if (saveAddressBtn) {
    saveAddressBtn.addEventListener("click", async () => {
      const getVal = (id) => document.getElementById(id)?.value.trim() || "";

      const formData = {
        _id: getVal("addressId") || undefined,
        label: getVal("addressLabel"),
        name: getVal("addressName"),
        line1: getVal("addressLine1"),
        line2: getVal("addressLine2"),
        city: getVal("addressCity"),
        state: getVal("addressState"),
        postal: getVal("addressPostal"),
        country: getVal("addressCountry"),
        phone: getVal("addressPhone"),
        isDefault: document.getElementById("addressDefault")?.checked || false,
      };

      if (
        !formData.name ||
        !formData.line1 ||
        !formData.city ||
        !formData.postal
      ) {
        showMessage("⚠️ Please fill in all required fields", "error");
        return;
      }

      await addressManager?.saveAddress(formData);
    });
  }

  // Integrate with password modal confirm
  const confirmPasswordVerify = document.getElementById(
    "confirmPasswordVerify",
  );
  if (confirmPasswordVerify) {
    const originalHandler = confirmPasswordVerify.onclick;
    confirmPasswordVerify.addEventListener("click", async () => {
      const password = document.getElementById("verifyPassword")?.value;
      if (addressManager?.pendingAction && password) {
        try {
          await addressManager.executePendingAction(password);
        } catch (error) {
          // Error already shown
        }
      } else if (originalHandler) {
        originalHandler();
      }
    });
  }
});

// Safe message helper
function showMessage(text, type = "error") {
  const box = document.getElementById("messageBox");
  if (box) {
    box.textContent = text;
    box.className = `message-box ${type}`;
    box.style.display = "block";
    if (type === "success") {
      setTimeout(() => (box.style.display = "none"), 4000);
    }
  } else {
    // ✅ Fallback: console log instead of alert (won't block navigation)
    console.log(`[Addresses] ${type.toUpperCase()}: ${text}`);
  }
}

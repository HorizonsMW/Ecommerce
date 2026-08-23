const express = require("express");
const {
  createUser,
  loginUserCtrl,
  getAllUsers,
  getAUser,
  deleteAUser,
  updateAUser,
  blockAUser,
  unblockAUser,
  handleRefreshToken,
  logout,
  verifyPassword,
} = require("../../controller/userCtrl");
const {
  authMiddleware,
  isAdmin,
  isLoggedIn,
} = require("../../middlewares/authMiddleware");
const asyncHandler = require("express-async-handler");
const User = require("../../models/userModel");
const mongoose = require("mongoose");
const router = express.Router();

router.post("/register", createUser); //new user creation
router.post("/login", loginUserCtrl); // user login
router.get("/logout", logout); // user logout
router.get("/refresh", handleRefreshToken); //

// POST /api/user/verify-password - Verify password before sensitive actions
router.post("/verify-password", authMiddleware, verifyPassword);

router.get("/all-users", getAllUsers); // get all users
//router.get("/:id",getAUser);// get a user

///Addresses

// In authroute.js, add before your address routes:
router.use("/addresses", (req, res, next) => {
  console.log("🎯 /addresses route matched:", {
    method: req.method,
    path: req.path,
    userId: req.user?._id?.toString(),
  });
  next();
});

// ✅ ADDRESSES ROUTES - MUST COME BEFORE /:id
/// Addresses

// GET /api/user/addresses - Get addresses for authenticated user
router.get(
  "/addresses",
  isLoggedIn,
  asyncHandler(async (req, res) => {
    // Inside the GET /addresses route handler, before User.findById():
    console.log("🔐 Auth debug:", {
      hasUser: !!req.user,
      userId: req.user?._id?.toString(),
      tokenPresent: !!req.headers.authorization,
    });

    console.log("🗄️ DB connection:", mongoose.connection.readyState); // 1 = connected
    try {
      const userId = req.user._id;

      const user = await User.findById(userId).select("address").lean();

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      const addresses = user.address || [];
      const formattedAddresses = addresses.map((addr) => ({
        ...addr,
        _id: addr._id?.toString?.() || addr._id,
      }));

      res.json({
        success: true,
        addresses: formattedAddresses,
        count: formattedAddresses.length,
      });
    } catch (error) {
      console.error("Error fetching user addresses:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch addresses",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }),
);

// POST /api/user/addresses - Add new address
router.post(
  "/addresses",
  isLoggedIn,
  asyncHandler(async (req, res) => {
    const {
      label,
      name,
      line1,
      line2,
      city,
      state,
      postal,
      country,
      phone,
      isDefault,
    } = req.body;

    const userId = req.user._id.toString(); // ✅ Convert to string

    if (!name || !line1 || !city || !postal || !country || !phone) {
      return res
        .status(400)
        .json({ message: "Missing required address fields" });
    }

    const user = await User.findById(userId);

    if (isDefault) {
      user.address = user.address.map((addr) => ({
        ...addr.toObject(),
        isDefault: false,
      }));
    }

    user.address.push({
      label: label || "Address",
      name,
      line1,
      line2: line2 || "",
      city,
      state,
      postal,
      country,
      phone,
      isDefault: isDefault || false,
    });

    await user.save();
    res.json({ success: true, address: user.address[user.address.length - 1] });
  }),
);

// PUT /api/user/addresses/:id - Update existing address
router.put(
  "/addresses/:id",
  isLoggedIn,
  asyncHandler(async (req, res) => {
    const userId = req.user._id.toString(); // ✅ Convert to string
    const { id } = req.params;
    const {
      label,
      name,
      line1,
      line2,
      city,
      state,
      postal,
      country,
      phone,
      isDefault,
    } = req.body;

    const user = await User.findById(userId);
    const addressIndex = user.address.findIndex(
      (addr) => addr._id.toString() === id,
    );

    if (addressIndex === -1) {
      return res.status(404).json({ message: "Address not found" });
    }

    if (isDefault) {
      user.address = user.address.map((addr) => ({
        ...addr.toObject(),
        isDefault: false,
      }));
    }

    const existing = user.address[addressIndex].toObject();
    user.address[addressIndex] = {
      ...existing,
      label: label || existing.label,
      line1: line1 || existing.line1,
      line2: line2 !== undefined ? line2 : existing.line2,
      city: city || existing.city,
      state: state || existing.state,
      postal: postal || existing.postal,
      country: country || existing.country,
      phone: phone || existing.phone,
      isDefault: isDefault !== undefined ? isDefault : existing.isDefault,
    };

    await user.save();
    res.json({ success: true, address: user.address[addressIndex] });
  }),
);

// DELETE /api/user/addresses/:id - Delete address
router.delete(
  "/addresses/:id",
  isLoggedIn,
  asyncHandler(async (req, res) => {
    const userId = req.user._id.toString(); // ✅ Convert to string
    const { id } = req.params;

    const user = await User.findById(userId);
    const initialLength = user.address.length;

    user.address = user.address.filter((addr) => addr._id.toString() !== id);

    if (user.address.length === initialLength) {
      return res.status(404).json({ message: "Address not found" });
    }

    if (user.address.length > 0 && !user.address.some((a) => a.isDefault)) {
      user.address[0].isDefault = true;
    }

    await user.save();
    res.json({ success: true });
  }),
);

////End of addresses

router.delete("/:id", deleteAUser); // delete a user
router.put("/edit-user", authMiddleware, /*isAdmin,*/ updateAUser); // update a user -  only admin can update user //user can update themseleves
router.put("/block-user/:id", authMiddleware, isAdmin, blockAUser); // block a user -  only admin can block/unblock user
router.put("/unblock-user/:id", authMiddleware, isAdmin, unblockAUser); // ubblock a user -  only admin can block/unblock user

router.get(
  "/:id",
  authMiddleware,
  /**isAdmin, causing issues with adress fetching on user page */ getAUser,
); // get a user - only admin can get user
module.exports = router;

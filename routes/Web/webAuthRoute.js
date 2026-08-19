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
const router = express.Router();
const asyncHandler = require("express-async-handler");

/*const rateLimit = require('express-rate-limit');

const verifyPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: { message: 'Too many password attempts. Please try again later.' },
    keyGenerator: (req) => req.user?._id || req.ip // Limit per user or IP
});*/

//var/home/horizons/Projects/Ecommerce/routes/Web/webAuthRoute.js:24 NOT FOUND ('express-rate-limit');

router.post("/register", createUser); // New user creation
router.get("/register", async (req, res) => {
  try {
    console.log("loading register");
    res.render("pages/user/register", {
      title: "register",
      layout: "layouts/main",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
}); // New user creation

///router.post("/login", loginUserCtrl); // User login
// New login route to handle redirect params
// Helper: Detect if request expects JSON (API) or HTML (web page)

const isApiRequest = (req) => {
  return (
    req.headers["accept"]?.includes("application/json") ||
    req.path.startsWith("/api")
  );
};

// POST /login - Wrapper to handle redirect for web requests
router.post(
  "/login",
  asyncHandler(async (req, res, next) => {
    var redirectUrl = req.query.redirect || "/user/profile";
    const isWeb = !isApiRequest(req);

    if (req.query.redirect) {
      const decoded = decodeURIComponent(req.query.redirect);
      // ✅ Only allow safe internal redirects
      const allowedPaths = ["/products", "/user/profile", "/cart", "/"];
      if (allowedPaths.some((path) => decoded.startsWith(path))) {
        redirectUrl = decoded;
      }
    }

    if (isWeb) {
      // 🎯 For web requests: Override res.json to redirect instead of sending JSON
      const originalJson = res.json.bind(res);

      res.json = function (data) {
        // Successful login: controller returns { token, user... }
        if (data?.token) {
          // Cookies are already set by controller → just redirect
          return res.redirect(redirectUrl);
        }

        // Failed login: controller returns { message: "..." }
        // Render login page with error
        return res.render("pages/user/login", {
          title: "Login",
          error: data?.message || "Login failed",
          email: req.body?.email || "", // Preserve email for UX
          layout: "layouts/main",
        });
      };
    }

    // Call the original controller (unchanged)
    // It will use our overridden res.json for web requests
    await loginUserCtrl(req, res, next);
  }),
);

router.get("/login", async (req, res) => {
  try {
    console.log("loading login");
    // Only redirect to profile if already logged in
    if (req.user) {
      return res.redirect("/user/profile");
    }
    res.render("pages/user/login", { title: "Login", layout: "layouts/main" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});
// PUT /api/user/edit-user - Update profile

router.get("/logout", logout); // User logout
router.get("/refresh", handleRefreshToken); //

router.get("/all-users", getAllUsers); // Get all users
//router.get("/:id", authMiddleware, isAdmin, getAUser); // Get a user - only admin can get user

// Protect the following routes with isLoggedIn middleware
// GET /user/profile - Render profile page (SSR)
router.get("/profile", isLoggedIn, (req, res) => {
  res.render("pages/user/profile", {
    user: req.user,
    title: "My Profile",
    layout: "layouts/main",
  });
});
//router.delete("/:id", deleteAUser); // Delete a user


// GET /api/user/addresses - Get all addresses for authenticated user
router.get('/addresses', isLoggedIn, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('address');
  res.json({ addresses: user.address || [] });
}));

// POST /api/user/addresses - Add new address
router.post('/addresses', isLoggedIn, asyncHandler(async (req, res) => {
  const { label, name, line1, line2, city, state, postal, country, phone, isDefault } = req.body;
  
  // Validate required fields
  if (!name || !line1 || !city || !postal || !country || !phone) {
    return res.status(400).json({ message: 'Missing required address fields' });
  }
  
  const user = await User.findById(req.user._id);
  
  // If setting as default, unset other defaults first
  if (isDefault) {
    user.address = user.address.map(addr => ({ ...addr, isDefault: false }));
  }
  
  // Add new address
  user.address.push({
    label: label || 'Address',
    name,
    line1,
    line2: line2 || '',
    city,
    state,
    postal,
    country,
    phone,
    isDefault: isDefault || false
  });
  
  await user.save();
  res.json({ success: true, address: user.address[user.address.length - 1] });
}));

// PUT /api/user/addresses/:id - Update existing address
router.put('/addresses/:id', isLoggedIn, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { label, name, line1, line2, city, state, postal, country, phone, isDefault } = req.body;
  
  const user = await User.findById(req.user._id);
  const addressIndex = user.address.findIndex(addr => addr._id.toString() === id);
  
  if (addressIndex === -1) {
    return res.status(404).json({ message: 'Address not found' });
  }
  
  // If setting as default, unset other defaults first
  if (isDefault) {
    user.address = user.address.map(addr => ({ ...addr, isDefault: false }));
  }
  
  // Update address
  user.address[addressIndex] = {
    ...user.address[addressIndex],
    label: label || user.address[addressIndex].label,
    name: name || user.address[addressIndex].name,
    line1: line1 || user.address[addressIndex].line1,
    line2: line2 !== undefined ? line2 : user.address[addressIndex].line2,
    city: city || user.address[addressIndex].city,
    state: state || user.address[addressIndex].state,
    postal: postal || user.address[addressIndex].postal,
    country: country || user.address[addressIndex].country,
    phone: phone || user.address[addressIndex].phone,
    isDefault: isDefault !== undefined ? isDefault : user.address[addressIndex].isDefault
  };
  
  await user.save();
  res.json({ success: true, address: user.address[addressIndex] });
}));

// DELETE /api/user/addresses/:id - Delete address
router.delete('/addresses/:id', isLoggedIn, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const user = await User.findById(req.user._id);
  const initialLength = user.address.length;
  
  user.address = user.address.filter(addr => addr._id.toString() !== id);
  
  if (user.address.length === initialLength) {
    return res.status(404).json({ message: 'Address not found' });
  }
  
  // If deleted address was default, set first remaining as default
  if (user.address.length > 0 && !user.address.some(a => a.isDefault)) {
    user.address[0].isDefault = true;
  }
  
  await user.save();
  res.json({ success: true });
}));

router.put("/edit-user", authMiddleware, updateAUser); // Update a user
router.put("/block-user/:id", authMiddleware, isAdmin, blockAUser); // Block a user - only admin can block/unblock user
router.put("/unblock-user/:id", authMiddleware, isAdmin, unblockAUser); // Unblock a user - only admin can block/unblock user
module.exports = router;

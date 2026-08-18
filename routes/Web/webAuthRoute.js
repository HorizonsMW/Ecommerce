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
      res.render("pages/user/register", { title: "register", layout: "layouts/main" });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
  }); // New user creation


router.post("/login", loginUserCtrl); // User login
router.get("/login", async (req, res) => {
  try {
    console.log("loading login");
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
router.get('/profile', isLoggedIn, (req, res) => {
    // req.user is attached by authMiddleware
    res.render('pages/user/profile', { 
        user: req.user,
        title: 'My Profile',
        layout: "layouts/main"
    });
});

//router.delete("/:id", deleteAUser); // Delete a user

router.put("/edit-user", authMiddleware, updateAUser); // Update a user
router.put("/block-user/:id", authMiddleware, isAdmin, blockAUser); // Block a user - only admin can block/unblock user
router.put("/unblock-user/:id", authMiddleware, isAdmin, unblockAUser); // Unblock a user - only admin can block/unblock user
module.exports = router;

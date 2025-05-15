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
} = require("../../controller/userCtrl");
const {
  authMiddleware,
  isAdmin,
  isLoggedIn,
} = require("../../middlewares/authMiddleware");
const router = express.Router();

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

router.get("/logout", logout); // User logout
router.get("/refresh", handleRefreshToken); //

router.get("/all-users", getAllUsers); // Get all users
//router.get("/:id",getAUser);// get a user
router.get("/:id", authMiddleware, isAdmin, getAUser); // Get a user - only admin can get user

// Protect the following routes with isLoggedIn middleware
router.get("/profile", isLoggedIn, (req, res) => {
  res.json(req.user); // Return user data if logged in
});

router.delete("/:id", deleteAUser); // Delete a user
router.put("/edit-user", authMiddleware, isAdmin, updateAUser); // Update a user - only admin can update user
router.put("/block-user/:id", authMiddleware, isAdmin, blockAUser); // Block a user - only admin can block/unblock user
router.put("/unblock-user/:id", authMiddleware, isAdmin, unblockAUser); // Unblock a user - only admin can block/unblock user
module.exports = router;

const express = require("express");
const { createUser, loginUserCtrl, getAllUsers, getAUser, deleteAUser, updateAUser,blockAUser,unblockAUser, handleRefreshToken, logout } = require("../../controller/userCtrl");
const { authMiddleware, isAdmin } = require("../../middlewares/authMiddleware");
const router = express.Router();

router.post("/register",createUser); //new user creation
router.post("/login",loginUserCtrl);// user login
router.get("/logout",logout);// user logout
router.get("/refresh",handleRefreshToken);// 

router.get("/all-users",getAllUsers);// get all users
//router.get("/:id",getAUser);// get a user
router.get("/:id",authMiddleware,isAdmin,getAUser);// get a user - only admin can get user

router.delete("/:id",deleteAUser);// delete a user
router.put("/edit-user",authMiddleware,isAdmin,updateAUser);// update a user -  only admin can update user
router.put("/block-user/:id",authMiddleware,isAdmin,blockAUser);// block a user -  only admin can block/unblock user
router.put("/unblock-user/:id",authMiddleware,isAdmin,unblockAUser);// ubblock a user -  only admin can block/unblock user
module.exports = router;
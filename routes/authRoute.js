const express = require("express");
const { createUser, loginUserCtrl, getAllUsers, getAUser, deleteAUser, updateAUser } = require("../controller/userCtrl");
const { authMiddleware } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/register",createUser); //new user creation
router.post("/login",loginUserCtrl);// user login
router.get("/all-users",getAllUsers);// get all users
//router.get("/:id",getAUser);// get a user
router.get("/:id",authMiddleware,getAUser);// get a user
router.delete("/:id",deleteAUser);// delete a user
router.put("/:id",updateAUser);// update a user
module.exports = router;
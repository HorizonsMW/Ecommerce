const { generateToken } = require("../config/jwtToken");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const { validateMongoDbId } = require("../utils/validateMongodbId");
const { generaterefreshToken } = require("../config/refreshtoken");
const jwt = require("jsonwebtoken");

//create user function
const createUser = asyncHandler(async (req, res) => {
  //check whether a user exists first
  const email = req.body.email;
  const findUser = await User.findOne({ email: email });
  if (!findUser) {
    //if not find user then create new user
    const newUser = User.create(req.body);
    res.json({ newUser });
  } else {
    //user exists
    /*
            //before using asyncHandler
            res.json({
                msg:"User already exists",
                success:false,
            });*/

    throw new Error("User alredy exists");
  }
});

//login fucntion
const loginUserCtrl = asyncHandler(async (req, res) => {
  //get email and pass
  const { email, password } = req.body;
  //console.log(email,password);
  //check if user exists
  const findUser = await User.findOne({ email }); //true or false
  //console.log(findUser) //return user with inpute email

  if (findUser && (await findUser.isPasswordMatched(password))) {
    //res.json(findUser); //return the found user


///////////////////////////////////////////////////////////////////////
// /
// In controller/userCtrl.js, inside loginUserCtrl, AFTER generating token:

const accessToken = generateToken(findUser._id); // Your existing JWT generation

// 🍪 Set httpOnly cookie for SSR page protection
res.cookie('token', accessToken, {
  httpOnly: true,              // ❌ JavaScript can't access (XSS protection)
  secure: process.env.NODE_ENV === 'production', // ✅ HTTPS only in prod
  sameSite: 'lax',             // ✅ CSRF protection
  maxAge: 24 * 60 * 60 * 1000  // 24 hours (match your JWT expiry)
});

// Also keep your existing refreshToken cookie
// Return response (token still in body for API clients)
///////////////////////////////////////////////////////////////////////
    const refreshToken = await generaterefreshToken(findUser?._id);
    const updateUser = await User.findByIdAndUpdate(
      findUser.id,
      { refreshToken: refreshToken },
      { new: true },
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });
    res.json({
      _id: findUser._id,
      firstname: findUser.firstname,
      lastname: findUser.lastname,
      email: findUser.email,
      mobile: findUser.mobile,
      token: accessToken,
    });
  } else {
    //res.send("Invalid credentials");//this is an alternative sub for issue updated* err?message thing in errorHandler -- solved
    throw new Error("Invalid credentials"); //custom message not working due to the *updated* err?message thing in errorHandler
  }
});
//handle refresh Token
const handleRefreshToken = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  //console.log(cookie);
  if (!cookie?.refreshToken) throw new Error("No refresh token in cookies");
  const refreshToken = cookie.refreshToken;
  console.log(refreshToken);

  const user = await User.findOne({ refreshToken });
  if (!user) {
    throw new Error("No refresh Token in DB/Not matched");
  }
  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
    //console.log(decoded); //to know what we are getting as feedback
    if (err || user.id !== decoded.id) {
      throw new Error("There is something wrong with refresh token");
    }
    const accessToken = generateToken(user?._id);
    res.json({ accessToken });
  });
  //res.json(user);
});

// controller/userCtrl.js
const logout = asyncHandler(async (req, res) => {
  const cookie = req.cookies;

  // 1. Check if refreshToken exists in cookies
  if (!cookie?.refreshToken) {
    return res.status(400).json({ message: "No refresh token in cookies" });
  }

  const refreshToken = cookie.refreshToken;

  // 2. Find user with this refreshToken
  const user = await User.findOne({ refreshToken });

  // 3. If no user found, clear cookie anyway and return
  if (!user) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // ✅ Only secure in prod
      sameSite: "lax",
    });
    return res.sendStatus(204); // No Content (not "forbidden" - 403 is forbidden)
  }

  // 4. ✅ CORRECTED: Use filter object { refreshToken: refreshToken }
  await User.findOneAndUpdate(
    { refreshToken: refreshToken }, // ✅ Filter: find user BY this refreshToken
    { refreshToken: "" }, // ✅ Update: clear the refreshToken field
  );

  // 5. Clear the httpOnly cookie
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  // 6. Send success response
  res.sendStatus(204); // No Content = successful logout
});

//update a user
const updateAUser = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString();
    validateMongoDbId(userId);
  // Inside updateAUser, before findByIdAndUpdate:
  if (req.body.email && req.body.email !== req.user.email) {
    const existing = await User.findOne({ email: req.body.email });
    if (existing) {
      throw new Error("Email already in use");
    }
  }
  try {
    const updateUser = await User.findByIdAndUpdate(
      userId,
      {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        mobile: req.body.mobile,
      },
      {
        new: true,
      },
    );
    res.json(updateUser);
  } catch (error) {
    throw new Error(error);
  }
});
//get all users
const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const getUsers = await User.find();
    res.json(getUsers);
  } catch (error) {
    throw new Error(error);
  }
});
//get a single user
const getAUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    //console.log({id});
    const getaUser = await User.findById(id);
    res.json({ getaUser });
  } catch (error) {
    throw new Error(error);
  }
});
//delete a single user
const deleteAUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    //console.log({id});
    const deleteaUser = await User.findByIdAndDelete(id);
    res.json({ deleteaUser });
  } catch (error) {
    throw new Error(error);
  }
});
const blockAUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const block = await User.findByIdAndUpdate(
      id,
      {
        isBlocked: true,
      },
      {
        new: true,
      },
    );
  } catch (error) {
    throw new Error(error);
  }
  res.json({
    message: "User blocked",
  });
});

const unblockAUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const unblock = await User.findByIdAndUpdate(
      id,
      {
        isBlocked: false,
      },
      {
        new: true,
      },
    );
  } catch (error) {
    throw new Error(error);
  }
  res.json({
    message: "User unblocked",
  });
});

// Verify user password before sensitive actions
const verifyPassword = asyncHandler(async (req, res) => {
    const { password } = req.body;
    
    // 1. Validate input
    if (!password) {
        return res.status(400).json({ message: "Password is required" });
    }
    
    // 2. Get authenticated user
    const user = req.user;
    if (!user || !user._id) {
        return res.status(401).json({ message: "User not authenticated" });
    }
    
    // 3. 🔐 Re-fetch user WITH password for comparison
    //    authMiddleware excluded it, so we need to explicitly include it
    const userWithPassword = await User.findById(user._id).select('+password');
    
    if (!userWithPassword) {
        return res.status(404).json({ message: "User not found" });
    }
    
    // 4. Debug logging (remove after testing)
    console.log('🔐 verifyPassword debug:', {
        hasEnteredPassword: !!password,
        hasStoredPassword: !!userWithPassword.password,
        storedPasswordType: typeof userWithPassword.password,
        storedPasswordLength: userWithPassword.password?.length
    });
    
    // 5. Use your existing isPasswordMatched method
    const isMatch = await userWithPassword.isPasswordMatched(password);
    
    if (!isMatch) {
        return res.status(401).json({ message: "Incorrect password" });
    }
    
    // 6. ✅ Password verified
    res.json({ success: true, message: "Password verified" });
});

module.exports = {
  createUser,
  loginUserCtrl,
  getAllUsers,
  unblockAUser,
  blockAUser,
  getAUser,
  deleteAUser,
  updateAUser,
  handleRefreshToken,
  logout,
  verifyPassword,
};

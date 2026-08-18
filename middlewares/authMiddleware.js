const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

/*const authMiddleware = asyncHandler(async (req, res, next) => {
  let token;
  
  if (req?.headers?.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
    try {
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        //console.log(decoded); //if user is found, log details
        const user = await User.findById(decoded?.id);
        req.user = user;
        next();
      } else {
        console.log(res);
      }
    } catch (error) {
      throw new Error(
        "Not authorised, token expired. Please login again " && error
      );
    }
  } else {
    throw new Error("There is no token attached to the header");
  }
});*/

const authMiddleware = asyncHandler(async (req, res, next) => {
  let token;

  // 🔍 Priority 1: Check Authorization header (for API clients like fetch/Postman)
  if (req?.headers?.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 🔍 Priority 2: Check cookie (for browser/SSR page requests)
  else if (req.cookies?.token) {
    token = req.cookies.token;
  }
  // ❌ No token found in either location
  if (!token) {
    return res.status(401).json({ message: 'There is no token attached to the header or cookie' });
  }

  try {
    // ✅ Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ✅ Find user and attach to request
    const user = await User.findById(decoded?.id).select('-password -refreshToken');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = user;
    next();
    
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: 'Not authorised, token expired. Please login again.' });
  }
});

const isAdmin = asyncHandler(async (req, res, next) => {
  //console.log(req.user);
  const { email } = req.user;
  const adminUser = await User.findOne({ email });
  if (adminUser.role !== "admin") {
    throw new Error("You are not an admin");
  } else {
    next();
  }
});
/* //old one
const isLoggedIn = (req, res, next) => {
  if (req.user) {
    // User is logged in, proceed to the next middleware or route handler
    res.redirect("/user/profile");
    // return next();
  } else {
    // User is not logged in, redirect to login page
    res.redirect("/user/login");
  }
};*/

// middlewares/authMiddleware.js
const isLoggedIn = asyncHandler(async (req, res, next) => {
  let token;
  
  // Check Authorization header first (for API clients)
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Fallback to cookie (for browser/SSR)
  else if (req.cookies?.token) {
    token = req.cookies.token;
  }
  
  // No token found
  if (!token) {
    // API request → return JSON error
  
    if (req.path.startsWith('/api/') || req.headers['accept']?.includes('application/json')) {
      return res.status(401).json({ message: "Authentication required: No token provided" });
    }
    // Web page request → redirect to login

    const returnTo = req.originalUrl; // Save where they wanted to go
    return res.redirect(`/user/login?returnTo=${encodeURIComponent(returnTo)}`);
    //return res.redirect('/user/login');
  }

  try {
    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user and attach to request (exclude sensitive fields)
    const user = await User.findById(decoded.id).select('-password -refreshToken');
    
    if (!user) {
      // User not found → invalid token
      if (req.path.startsWith('/api/') || req.headers['accept']?.includes('application/json')) {
        return res.status(401).json({ message: "Invalid token: User not found" });
      }
      
      const returnTo = req.originalUrl; // Save where they wanted to go

      const allowedReturns = ['/user/profile', '/products', '/'];
      const redirectUrl = allowedReturns.includes(req.query.returnTo) ? req.query.returnTo : '/user/profile';
      return res.redirect(`/user/login?returnTo=${encodeURIComponent(redirectUrl)}`);
      //return res.redirect('/user/login');
    }
    
    // ✅ User authenticated → attach to request and proceed
    req.user = user;
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error.name, error.message);
    
    // Token expired/invalid
    if (req.path.startsWith('/api/') || req.headers['accept']?.includes('application/json')) {
      return res.status(401).json({ 
        message: "Authentication failed: Token expired or invalid",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // Clear invalid cookie and redirect
    res.clearCookie('token', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    return res.redirect('/user/login?message=Session+expired+-+please+login+again');
  }
});

module.exports = {
  authMiddleware,
  isAdmin,
  isLoggedIn,
};

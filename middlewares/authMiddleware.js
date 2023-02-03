const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

const authMiddleware = asyncHandler(async(req,res,next)=>{
    let token;
    if(req?.headers?.authorization?.startsWith("Bearer")){
        token = req.headers.authorization.split(" ")[1];
        try{
            if(token){
                const decoded = jwt.verify(token,process.env.JWT_SECRET);
                //console.log(decoded); //if user is found, log details
                const user = await User.findById(decoded?.id);
                req.user = user;
                next();
            }
        }catch(error){
            throw new Error("Not authorised, token expired. Please login again "&& error);
        }
    }else{
        throw new Error("There is no token attached to the header");
    }
});
const isAdmin = asyncHandler (async (req,res,next)=>{

});
module.exports = {
    authMiddleware
}
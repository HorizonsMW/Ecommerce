const { generateToken } = require("../config/jwtToken");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const { validateMongoDbId } = require("../utils/validateMongodbId");

//create user function
const createUser = asyncHandler(
    async(req,res)=>{
        //check whether a user exists first
        const email = req.body.email;
        const findUser = await User.findOne({email:email});
        if(!findUser){
            //if not find user then create new user  
            const newUser = User.create(req.body);
            res.json({newUser,});
    
        }else{
            //user exists
            /*
            //before using asyncHandler
            res.json({
                msg:"User already exists",
                success:false,
            });*/

            throw new Error("User alredy exists");
        }
    
    }
);

//login fucntion
const loginUserCtrl = asyncHandler(async(req,res)=>{
    //get email and pass
    const {email,password} = req.body;
    //console.log(email,password);
    //check if user exists
    const findUser = await User.findOne({email}); //true or false
    if (findUser && await findUser.isPasswordMatched(password)){
        //res.json(findUser); //return the found user
        res.json({
                _id:findUser._id,
                firstname:findUser.firstname,
                lastname:findUser.lastname,
                email:findUser.email,
                mobile:findUser.mobile,
                token:generateToken(findUser._id),
        });

    }else{
        //res.send("Invalid credentials");//this is an alternative sub for issue updated* err?message thing in errorHandler -- solved
        throw new Error("Invalid credentials");//custom message not working due to the *updated* err?message thing in errorHandler
    }

});
//update a user
const updateAUser = asyncHandler(async (req,res)=>{
    const {id} = req.user;
    validateMongoDbId(id);
    
    try{
        const updateUser = await User.findByIdAndUpdate(id,{
            firstname:req.body.firstname,
            lastname:req.body.lastname,
            email:req.body.email,
            mobile:req.body.mobile,            
        },{
            new:true
        });
        res.json(updateUser);
    }catch(error){
        throw new Error(error);
    }
});
//get all users
const getAllUsers = asyncHandler(async(req,res)=>{
    try{
        const getUsers = await User.find();
        res.json(getUsers);            
    }catch(error){
        throw new Error(error);
    }
});
//get a single user
const getAUser = asyncHandler(async(req,res)=>{
    const {id} = req.params;
    validateMongoDbId(id);

    try{
        //console.log({id});
        const getaUser = await User.findById(id);
        res.json({getaUser,});
    }catch(error){
        throw new Error(error);
    }
});
//delete a single user
const deleteAUser = asyncHandler(async(req,res)=>{
    const {id} = req.params;
    validateMongoDbId(id);

    try{
        //console.log({id});
        const deleteaUser = await User.findByIdAndDelete(id);
        res.json({deleteaUser,});
    }catch(error){
        throw new Error(error);
    }
});
const blockAUser = asyncHandler(async(req,res)=>{
    const {id} = req.params;
    validateMongoDbId(id);

    try {
        const block = await User.findByIdAndUpdate(id, {
            isBlocked:true,
        },
        {
            new:true,
        })
    } catch (error) {
        throw new Error(error);
    }
    res.json({
        message:"User blocked",
    });
});

const unblockAUser = asyncHandler(async(req,res)=>{
     const {id} = req.params;
    validateMongoDbId(id);

    try {
        const unblock = await User.findByIdAndUpdate(id, {
            isBlocked:false,
        },
        {
            new:true,
        })
    } catch (error) {
        throw new Error(error);
    }
    res.json({
        message:"User unblocked",
    });
});

module.exports={
    createUser,
    loginUserCtrl,
    getAllUsers,
    unblockAUser,
    blockAUser,
    getAUser,
    deleteAUser,
    updateAUser
}
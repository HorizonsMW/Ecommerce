//not found
const notFound = (req,res,next)=>{
    const error = new Error(`Not found : ${req.originalUrl}`);
    res.status(404);
    next(error);
};

//error Handler
const errorHandler = (err,req,res,next)=>{
    const statuscode = res.statusCode == 200 ? 500 : res.statusCode;
    res.status(statuscode);
    res.json({
        message: err.message, //problem with itial code, added speech marks//there was an update that changed this--  err?.message, remove qmark
        stack: err.stack,
    });
};

module.exports = {
    errorHandler,
    notFound
}
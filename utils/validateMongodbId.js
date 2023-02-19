const { default: mongoose } = require("mongoose");
//use this fuction to check whether the id passed for an item exists in the database or not
//instead of getting system errors, this funtion simplifies that and informs
//the dev that an id does not exist
const validateMongoDbId = (id)=>{
    const isValid = mongoose.Types.ObjectId.isValid(id);
    if(!isValid) throw new Error("This id is not valid or was not found");
}
module.exports = {validateMongoDbId};
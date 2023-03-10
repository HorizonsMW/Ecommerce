const mongoose = require('mongoose'); // Erase if already required
const bcrypt = require("bcrypt");

/**(node:16668) [MONGOOSE] DeprecationWarning: Mongoose: the `strictQuery` option will be switched back to `false` by default in Mongoose 7.
 * Use `mongoose.set('strictQuery', false);` if you want to prepare for this change.
 * Or use `mongoose.set('strictQuery', true);` to suppress this warning. */

mongoose.set('strictQuery', false);

// Declare the Schema of the Mongo model
var userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true,
    },
    lastname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    mobile: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: "user",
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
    cart: {
        type: Array,
        default: [],
    },
    address: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
    }],
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
    }],
    refreshToken: {
        type: String,
    },
}, {
    timestamps: true,
});

userSchema.pre("save", async function (next) {
    const salt = await bcrypt.genSaltSync(10);
    this.password = await bcrypt.hash(this.password, salt);
});
userSchema.methods.isPasswordMatched = async function (enterdPassword) {
    return await bcrypt.compare(enterdPassword, this.password);
};
//Export the model
module.exports = mongoose.model('User', userSchema);
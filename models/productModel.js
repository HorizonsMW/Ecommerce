const mongoose = require('mongoose'); // Erase if already required

/**(node:16668) [MONGOOSE] DeprecationWarning: Mongoose: the `strictQuery` option will be switched back to `false` by default in Mongoose 7.
 * Use `mongoose.set('strictQuery', false);` if you want to prepare for this change.
 * Or use `mongoose.set('strictQuery', true);` to suppress this warning. */

mongoose.set('strictQuery', false);

// Declare the Schema of the Mongo model
var productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    brand: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        select: false,//hide this info from user
    },
    sold: {
        type: Number,
        default: 0,
    },
    images: {
        type: Array,
    },
    color: {
        type: String,
        required: true,
    },
    ratings: [{
        star: Number,
        postedby: { type: mongoose.Schema.Types.ObjectId, ref: "User", }
    }]
}, { timestamps: true }
);

//Export the model
module.exports = mongoose.model('Product', productSchema);
const asyncHandler = require("express-async-handler");
const Product = require("../models/productModel");
const slugify = require("slugify");

//new Product
const createProduct = asyncHandler(async (req, res) => {
    try {
        if (req.body.title) {
            req.body.slug = slugify(req.body.title);//create a slug for the new product
            //slugify creates a new modified string from the provided string
        }
        const newProduct = await Product.create(req.body);
        res.json(newProduct);
    } catch (error) {
        throw new Error(error);
    }
});
//update a Product
const updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        if (req.body.title) {
            req.body.slug = slugify(req.body.title);//create a slug for the new product
            //slugify creates a new modified string from the provided string
        }
        const updateAProduct = await Product.findByIdAndUpdate(id, req.body, { new: true, });
        res.json(updateAProduct);

    } catch (error) {
        throw new Error(error);
    }
});
//delete a Product
const deleteAProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        const deleteProduct = await Product.findByIdAndDelete(id);
        res.json(deleteProduct);

    } catch (error) {
        throw new Error(error);
    }
});

//get one Product
const getAProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        const findProduct = await Product.findById(id);
        res.json(findProduct);
    } catch (error) {
        throw new Error(error);
    }
});
//get all Products
const getAllProducts = asyncHandler(async (req, res) => {
    console.log(req.query);
    /**when params are set (localhost:5000/api/product/?brand=Apple) - log the query that will be sent to the database 
     * according to the params set on the URL*/
    try {
        const allProducts = await Product.find(req.query);//all Products//filtered - leave params blank for all products

        /** when req.query is added (const allProducts = await Product.find(req.query); ), only products with certain keys can be shown
         * This is a method of filtering the rresults obtained from the database
         *  by adding params to the url, eg: localhost:5000/api/product/?category=Smartphone&brand=Samsung
         * this URL only retrieves Smartphones from Samsung*/

        /**Another way to filter the results is by being more specific on the req.query method
         * eg:  
         * const allProducts = await Product.find({
         * brand:req.query.brand,
         * category:req.query.category,
         * });
         * PSA: this second method did not work for me
         */
        /**
         * Another way to filter results is 
         * const allProducts = await Product.where("category").equals(req.query.category);
         */

        res.json(allProducts);//send output
    } catch (error) {
        throw new Error(error);
    }
});

//export functions
module.exports = { createProduct, getAProduct, getAllProducts, updateProduct, deleteAProduct };
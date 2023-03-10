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
     * according to the params set on the URL
     * */
    try {
        const allProducts = await Product.find(req.query);//all Products//filtered - leave params blank for all products

        /** when req.query is added (const allProducts = await Product.find(req.query); ), only products with certain keys can be shown
         * This is a method of filtering the rresults obtained from the database
         *  by adding params to the url, eg: localhost:5000/api/product/?category=Smartphone&brand=Samsung
         * this URL only retrieves Smartphones from Samsung
         * */

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
         * const allProducts = await Product.where("category").equals(req.query.category);*/

        res.json(allProducts);//send output
    } catch (error) {
        throw new Error(error);
    }
});

/** WHile getAllProducts works perfectly, I will create a new fuction to include sorting of products
 * based on set params, getAllProducts includes only the base filtering of products */

const getAllProductsSorted = asyncHandler(async (req, res) => {
   // console.log(req.query);//original query from params

    /**In this function, we are going to destructure the query object */

    try {
        const queryObj = { ...req.query }; /**Destructuring allows to pass a sort parameter that 
        sorts the items as need, eg: sort=price will sort items based on the price, this information is obtained 
        from the destructered query object */

        //filtering
        const exludeFields = ["page", "sort", "limit", "fields"];
        exludeFields.forEach((el) => delete queryObj[el]);

        //when you pass ?price[gte]=129000 you get a  "CastError: Cast to Number failed for value \"{ gte: '129000' }\" lets solve this
        let queryString = JSON.stringify(queryObj);
        queryString = queryString.replace(/\b(gte|gt|lte|lt)\b/g, (match) =>  `$${match}` );
        console.log("queryString is ", JSON.parse(queryString));

        const query = Product.find(JSON.parse(queryString));

        console.log("filtered query ",queryObj, "original query ", req.query);//comparing filtered query with original query
        const product = await query;
        res.json(product);//send output
        /** ?price[gte]=129000 allows you to filter products within a certain product range, ?price[gte]=129000  will send 
         * products with a price higher than 129000
         * the terms
         * gte|gt|lte|lt stand for mathematical conditions:
         * gte >=
         * gt >
         * lte <=
         * lt <
         * This lets you set more complex parameters in your queries, i.e, ?price[gte]=129000&price[lt]=140000 and so on
          */


        //const allProducts = await Product.find(queryObj);//pass in filtered query instead of original
        /**From the filtered queryObj, you can use params such as ?price=129000 to get specific products */
        //res.json(allProducts);//send output

    } catch (error) {
        throw new Error(error);
    }
});


//export functions
module.exports = { createProduct, getAProduct, getAllProducts, updateProduct, deleteAProduct, getAllProductsSorted };
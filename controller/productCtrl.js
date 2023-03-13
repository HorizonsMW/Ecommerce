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

//get all Products -- setting this to be used for developemnt purposes only because it fetches all fields of a product, route changed to "/api/product/dev"
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

        //filtering==========================================================================================
        const exludeFields = ["page", "sort", "limit", "fields"];
        exludeFields.forEach((el) => delete queryObj[el]);

        //when you pass ?price[gte]=129000 you get a  "CastError: Cast to Number failed for value \"{ gte: '129000' }\" lets solve this
        let queryString = JSON.stringify(queryObj);
        queryString = queryString.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
        console.log("queryString is ", JSON.parse(queryString));

        let query = Product.find(JSON.parse(queryString));
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


        console.log("filtered query ", queryObj, "original query ", req.query);//comparing filtered query with original query

        //sorting==========================================================================================
        if (req.query.sort) {
            const sortBy = req.query.sort.split(",").join(" ");
            query = query.sort(sortBy);

            /**Sorting involves ordering items based on a certain criteria, eg
             * ?sort=title,price
             * sorts items based on the title first then the price
             * you can use "-" to reverse the sort eg
             * ?sort=-title
             */
        } else {
            query = query.sort('-updatedAt');/**Default */
        }

        //limiting the fields=======================================================================================

        if (req.query.fields) {
            const fields = req.query.fields.split(",").join(" ");
            query = query.select(fields);
            /**Fields are the different entries associated with a product, some of them do not need to be shown to the 
             * customer, to show select fields, type: ?fields=title,price will only show the titles and prices of the products
             * However, if "-" is added to a field, then the field is not shown, eg
             *  ?fields=-title 
             * */
        } else {
            query = query.select("-__v");/**Fields to hide */
        }

        //pagination - how many products per page==================================================================
        const page = req.query.page;
        const limit = req.query.limit;
        const skip = (page - 1) * limit;
        /**Skip is the number of products from start that will not be shown based on the page number and the limit
         * limit is the number of items to be shown on a certain page
         * Usage: ?page=2&limit=3 
         * for 3 items in a page
         */
        //console.log(page,limit,skip);
        query=query.skip(skip).limit(limit);

        if(req.query.page){
            const productCount = await Product.countDocuments();
            if(skip>=productCount)throw new Error("This page does not exist");
            //console.log(productCount);
        }


        const product = await query;
        res.json(product);//send output

        //const allProducts = await Product.find(queryObj);//pass in filtered query instead of original
        /**From the filtered queryObj, you can use params such as ?price=129000 to get specific products */
        //res.json(allProducts);//send output

    } catch (error) {
        throw new Error(error);
    }
});


//export functions
module.exports = { createProduct, getAProduct, getAllProducts, updateProduct, deleteAProduct, getAllProductsSorted };
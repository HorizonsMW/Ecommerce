const express = require('express');
const dbConnect = require('./config/dbConnect');
const app = express();
const dotenv = require('dotenv').config();
const authRouter = require("./routes/APIs/authRoute");
const productRouter = require("./routes/APIs/productRoute");
const cartRouter = require("./routes/APIs/cartRoute");
const bodyParser = require('body-parser');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const cookieParser = require("cookie-parser");
const morgan = require('morgan');
const PORT = process.env.PORT || 4000;
const expressLayouts = require('express-ejs-layouts'); // Import express-ejs-layouts



// index.js modifications for web ///
// Use express-ejs-layouts
app.use(expressLayouts);
const path = require('path');

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files middleware
app.use(express.static(path.join(__dirname, 'public')));

// index.js modifications for web ///


dbConnect();

app.use(morgan('combined'));//log activity on the console

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

//root -- remove for testing api
/*app.use('/',(req,res)=>{
    res.send('Hello World');
});*/
//users

/*// Separate API and GUI routes - testing separation
app.use('/api', require('./routes/api')); // All existing API routes -- Error: Cannot find module './routes/api'
app.use('/', require('./routes/web/pageRoutes')); // New GUI routes
*/

//initial development routes
app.use("/api/user", authRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);


// index.js modifications for web ///
//duplicate of development routes - testing GUI Routes
// Removed "api" from the path, duplicated all Routes in the APIs' folder into the Web folder
const webAuthRouter = require("./routes/Web/webAuthRoute");
const webProductRouter = require("./routes/Web/webProductRoute");
const webCartRouter = require("./routes/Web/webCartRoute");
app.use("/", webProductRouter);
app.use("/home", webProductRouter);
app.use("/user", webAuthRouter);
app.use("/product", webProductRouter);
app.use("/cart", webCartRouter);
// index.js modifications for web ///



app.use(notFound);
app.use(errorHandler);
app.listen(PORT, () => {
    console.log(`Server running on Port ${PORT}`);
});
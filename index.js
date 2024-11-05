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
app.use("/api/user", authRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);



app.use(notFound);
app.use(errorHandler);
app.listen(PORT, () => {
    console.log(`Server running on Port ${PORT}`);
});
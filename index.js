const express = require('express');
const dbConnect = require('./config/dbConnect');
const app = express();
const dotenv = require('dotenv').config();
const authRouter = require("./routes/APIs/authRoute");
const productRouter = require("./routes/APIs/productRoute");
const webCategoriesRouter = require("./routes/Web/webCategoriesRoute");
const cartRouter = require("./routes/APIs/cartRoute");
const bodyParser = require('body-parser');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const cookieParser = require("cookie-parser");
const cors = require('cors'); // ← Import cors
const morgan = require('morgan');
const PORT = process.env.PORT || 4000;
const expressLayouts = require('express-ejs-layouts'); // Import express-ejs-layouts
app.use(cookieParser());



// index.js modifications for web ///
// Use express-ejs-layouts
app.use(expressLayouts);
const path = require('path');

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
//console.log('📁 Views directory:', path.join(__dirname, 'views'));

// Static files middleware
app.use(express.static(path.join(__dirname, 'public')));

// index.js modifications for web ///


dbConnect();

// ✅ CORS Configuration - MUST be before routes
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, file://)
    if (!origin) return callback(null, true);
    
    // Allow localhost variants and LAN IPs for development
    const allowedOrigins = [
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      'http://localhost:4000', // If frontend runs on different port
      'http://192.168.1.100:5000', // ← Replace with your LAN IP
      'file://', // Allow local file access (dev only)
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // ✅ Allow cookies/auth headers to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

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
app.use("/api/products", productRouter);
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
app.use("/cart", webCartRouter);
app.use("/product", webProductRouter);
app.use("/categories", webCategoriesRouter);
//app.use("/api/cart", webCartRouter);

// index.js modifications for web ///



app.use(notFound);
app.use(errorHandler);
/* //app listening to localhost only
app.listen(PORT, () => {
    console.log(`Server running on Port ${PORT}`);
});*/

// app listening to all network interfaces
const HOST = process.env.HOST || '0.0.0.0'; // 0.0.0.0 = accept connections from any IP
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`LAN access: http://<YOUR_COMPUTER_IP>:${PORT}`);
});
// Graceful shutdown handlers
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
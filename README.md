## This is an Ecommerce project backend built using NodeJS and MongoDB
<img src = "./images/nodejs.jpeg" height = "30PX" alt = "NodeJS"/>          <img src = "./images/mongodb.png" height = "30PX" alt = "MongoDB"/>
---

## Users API
> The first stage which involved building the necessary APIs for user creation and management is complete. All parties interested in testing are welcome to do so.

### System requirements
* NodeJs version v18.13.0 or higher
* MongoDB 
```sh
db version v6.0.4
Build Info: {
    "version": "6.0.4",
    "gitVersion": "44ff59461c1353638a71e710f385a566bcd2f547",
    "openSSLVersion": "OpenSSL 1.1.1f  31 Mar 2020",
    "modules": [],
    "allocator": "tcmalloc",
    "environment": {
        "distmod": "ubuntu2004",
        "distarch": "x86_64",
        "target_arch": "x86_64"
    }
}

```

* Project was built on  **Ubuntu 22.04.1 LTS x86_64**, Host: 81H7 Lenovo ideapad 130-15IKB, Kernel: 5.15.0-58-generic 


### Below is some useful testing info.
To get started, run `npm run server` from the [root](./) directory
> The base URL is `Localhost:PORT/api`
>
## 1. User Management
> To test the User API, use the path `Localhost:PORT/api/user`
### 1.1 Register User
```http
POST /user/register
Content-Type: application/json

{
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@example.com",
    "mobile": "1234567890",
    "password": "password123"
}
```

### 1.2 Login
```http
POST /user/login
Content-Type: application/json

{
    "email": "john@example.com",
    "password": "password123"
}
```

Response includes JWT token for authentication.


### 1.3 Logout
```http
GET /user/logout
Authorization: Bearer <token>
```

### 1.4 Admin User Management
Requires admin privileges:
```http
GET /user/all-users          # Get all users
GET /user/:id                # Get specific user
PUT /user/edit-user          # Update user
PUT /user/block-user/:id     # Block user
PUT /user/unblock-user/:id   # Unblock user
DELETE /user/:id             # Delete user
```

## 2. Product Management

### 2.1 Create Product (Admin only)
```http
POST /product
Authorization: Bearer <admin_token>
Content-Type: application/json

{
    "title": "iPhone 13",
    "description": "Latest iPhone model",
    "price": 999,
    "category": "Smartphone",
    "brand": "Apple",
    "quantity": 100,
    "color": "Midnight Blue",
    "images": ["image_url1", "image_url2"]
}
```

### 2.2 Get Products
```http
GET /product/products        # Get all products (sorted)
GET /product/:id            # Get specific product
GET /product/dev            # Get all products (development)
```

#### Product Filtering Examples
```http
GET /product/products?brand=Apple
GET /product/products?category=Smartphone
GET /product/products?price[gte]=500&price[lte]=1000
```

#### Product Sorting Examples
```http
GET /product/products?sort=price
GET /product/products?sort=-price    # Descending order
GET /product/products?sort=title,price
```

#### Field Selection
```http
GET /product/products?fields=title,price,brand
```

#### Pagination
```http
GET /product/products?page=1&limit=10
```

### 2.3 Update Product (Admin only)
```http
PUT /product/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
    "price": 899,
    "quantity": 50
}
```

### 2.4 Delete Product (Admin only)
```http
DELETE /product/:id
Authorization: Bearer <admin_token>
``` 

## 3. Shopping Cart
### 3.1 Add to Cart
```http
POST /cart/add
Authorization: Bearer <token>
Content-Type: application/json

{
    "productId": "product_id",
    "quantity": 1
}
```

### 3.2 Update Cart Quantity
```http
PUT /cart/update
Authorization: Bearer <token>
Content-Type: application/json

{
    "productId": "product_id",
    "action": "increment"    # or "decrement"
}
```

### 3.3 Remove from Cart
```http
DELETE /cart/remove/:productId
Authorization: Bearer <token>
```

### 3.4 Get Cart
```http
GET /cart
Authorization: Bearer <token>
```

## Testing Process
1. Initial Setup
1. Install dependencies: npm install
2. Set up MongoDB locally or update connection string
3. Create .env file with required variables:

PORT=5000
MONGODB_URL=mongodb://localhost:27017/Ecommerce
JWT_SECRET=your_secret_key


### 2. Testing Flow

1. **User Authentication**
   - Register new user
    ```js
      router.post("/register" ,createUser);//new user creation
    ```
   - Login to get token
   - Test protected routes with token
2. **Admin Operations**
   - Create admin user
   - Test product management
   - Test user management
3. **Product Operations**
    - Create products (admin)
    - Test product filtering
    - Test sorting
    - Test pagination
4.  **Cart Operations**
    - Add items to cart
    - Update quantities
    - Remove items
    - View cart



Check the user model under [User Model](./models/userModel.js) for more info on the requirements for a user/admin
```js
router.post("/login",loginUserCtrl);// user login
router.get("/logout",logout);// user logout
router.get("/refresh",handleRefreshToken);//handle Refresh Token

router.get("/all-users",getAllUsers);// get all users
router.get("/:id",authMiddleware,isAdmin,getAUser);// get a user - only admin can get user

router.delete("/:id",deleteAUser);// delete a user
router.put("/edit-user",authMiddleware,isAdmin,updateAUser);// update a user -  only admin can update user
router.put("/block-user/:id",authMiddleware,isAdmin,blockAUser);// block a user -  only admin can block/unblock user
router.put("/unblock-user/:id",authMiddleware,isAdmin,unblockAUser);// ubblock a user -  only admin can block/unblock user

```
## Products API
The product API is now set for testing. To test the API, use the route `/api/product`
> Below is some more information
```js
router.post("/", authMiddleware, isAdmin, createProduct);//create a new product

router.get("/dev", getAllProducts);//get all products, no fields ommited: for development purposes
router.get("/products/", getAllProductsSorted);//get all products and sort accordingly
router.get("/:id", getAProduct);//get a product
router.put("/:id", authMiddleware, isAdmin, updateProduct);//update a product
router.delete("/:id", authMiddleware, isAdmin, deleteAProduct);//delete a product
```
## Cart API
The cart API is now set for testing. To test the API, use the route `/api/cart`
> To add a product to the cart, send a POST request to `Localhost:PORT/api/cart/add` with the following body:
```js 
// POST localhost:5000/api/cart/add
// Headers:
{
    "Authorization": "Bearer your-token-here",
    "Content-Type": "application/json"
}

// Body:
{
    "productId": "ID OF THE PRODUCT",
    "quantity": 1
}

```
> To get the cart, send a GET request to `Localhost:PORT/api/cart`

Up to this point, the project has been built without the assistance of AI technologies. Date: 02/11/2024.
Preceding updates will be built using AI technologies. Specifically, I use Cursor AI to build the project.

## Project Versions

### Current Version
- Node.js v20.18.0
- MongoDB v7.0.4
- Express v4.18.2
- Mongoose v8.0.3

### Development Tools
- VS Code v1.85.1
- Postman v10.21.9
- Git v2.43.0



![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E) ![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB) ![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white) ![NPM](https://img.shields.io/badge/NPM-%23000000.svg?style=for-the-badge&logo=npm&logoColor=white) ![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)

## 🌐 Socials:
[<img src = "https://brand.linkedin.com/content/dam/me/business/en-us/amp/brand-site/v2/bg/LI-Logo.svg.original.svg" height = "30PX" alt = "LinkedIn" />](https://linkedin.com/in/brian-mulwa-a700661a1/) [<img src = "https://about.twitter.com/content/dam/about-twitter/en/brand-toolkit/brand-download-img-1.jpg.twimg.1920.jpg" height = "30PX" alt = "Twitter" />  ](https://twitter.com/@marcobrayan4) [<img src = "https://static.whatsapp.net/rsrc.php/v3/y7/r/DSxOAUB0raA.png" height = "30PX" alt = "Whatsapp" />](https://api.whatsapp.com/send/?phone=254711990838&text&type=phone_number&app_absent=0) 

  ## ☕ Buy me a coffee
  [![PayPal](https://img.shields.io/badge/PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/bw112030hound@protonmail.com) 
  # **0711990838**   <img src = "./images/mpesa.jpeg" height = "30PX" alt = "NodeJS"/> 
## Kudos! Enjoy ❤️
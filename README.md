## This is an Ecommerce project backend built using NodeJS and MongoDB
<img src = "./images/nodejs.jpeg" height = "30PX" alt = "NodeJS"/>          <img src = "./images/mongodb.png" height = "30PX" alt = "MongoDB"/>
---
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
> To test the User API, use the path `Localhost:PORT/api/user`

```js 

router.post("/register" ,createUser);//new user creation
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

![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E) ![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB) ![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white) ![NPM](https://img.shields.io/badge/NPM-%23000000.svg?style=for-the-badge&logo=npm&logoColor=white) ![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)

## 🌐 Socials:
[<img src = "https://brand.linkedin.com/content/dam/me/business/en-us/amp/brand-site/v2/bg/LI-Logo.svg.original.svg" height = "30PX" alt = "LinkedIn" />](https://linkedin.com/in/brian-mulwa-a700661a1/) [<img src = "https://about.twitter.com/content/dam/about-twitter/en/brand-toolkit/brand-download-img-1.jpg.twimg.1920.jpg" height = "30PX" alt = "Twitter" />  ](https://twitter.com/@marcobrayan4) [<img src = "https://static.whatsapp.net/rsrc.php/v3/y7/r/DSxOAUB0raA.png" height = "30PX" alt = "Whatsapp" />](https://api.whatsapp.com/send/?phone=254711990838&text&type=phone_number&app_absent=0) 

  ## ☕ Buy me a coffee
  [![PayPal](https://img.shields.io/badge/PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/bw112030hound@protonmail.com) 
  # **0711990838**   <img src = "./images/mpesa.jpeg" height = "30PX" alt = "NodeJS"/> 
## Kudos! Enjoy ❤️
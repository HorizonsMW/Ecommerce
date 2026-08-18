const mongoose = require("mongoose"); // Erase if already required
const bcrypt = require("bcrypt");

/**(node:16668) [MONGOOSE] DeprecationWarning: Mongoose: the `strictQuery` option will be switched back to `false` by default in Mongoose 7.
 * Use `mongoose.set('strictQuery', false);` if you want to prepare for this change.
 * Or use `mongoose.set('strictQuery', true);` to suppress this warning. */

mongoose.set("strictQuery", false);

// Declare the Schema of the Mongo model
var userSchema = new mongoose.Schema(
  {
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
      select: false, // ✅ Exclude from queries by default
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
    address: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
      },
    ],
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    refreshToken: {
      type: String,
      select: false  // ✅ Also hide refresh tokens from queries
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function (next) {
  // Only hash if password was modified AND doesn't look like a bcrypt hash
  if (this.isModified("password") && this.password) {
    // Bcrypt hashes start with "$2a$", "$2b$", or "$2y$"
    const isAlreadyHashed = /^\$2[aby]\$/.test(this.password);

    if (!isAlreadyHashed) {
      // ✅ Hash plain-text password
      const salt = await bcrypt.genSaltSync(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    // Else: password is already hashed → skip hashing
  }
  next();
});

/*
userSchema.methods.isPasswordMatched = async function (enterdPassword) {
    return await bcrypt.compare(enterdPassword, this.password);
};*/

userSchema.methods.isPasswordMatched = async function (enteredPassword) {
  // Safety check
  if (!enteredPassword || !this.password) {
    console.error("❌ isPasswordMatched: missing arguments", {
      entered: !!enteredPassword,
      stored: !!this.password,
    });
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};
//Export the model
module.exports = mongoose.model("User", userSchema);

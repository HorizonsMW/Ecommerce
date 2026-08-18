// scripts/seedUsers.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");

const users = [
  {
    firstname: "Alice",
    lastname: "Johnson",
    email: "testuser1@example.com",
    mobile: "1234567890",
    password: "Test@1234",
    role: 'user',
    isBlocked: false,
  },
  {
    firstname: "Bob",
    lastname: "Smith",
    email: "testuser2@example.com",
    mobile: "1234567891",
    password: "Test@1234",
    //role missing, user
    isBlocked: false,
  },
  {
    firstname: "Charlie",
    lastname: "Admin",
    email: "admin@example.com",
    mobile: "1234567892",
    password: "Test@1234",
    role: 'admin', //Admin privileges
    isBlocked: false,
  },
];

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to MongoDB");

    // Insert users (skip if email already exists)
    for (const user of users) {
      const exists = await User.findOne({ email: user.email });
      if (!exists) {
        await User.create(user); // userModel pre-save hook handles hashing
        console.log(`Created: ${user.email}`);
      } else {
        console.log(`Already exists: ${user.email}`);
      }
    }

    console.log("Seed completed!");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
};

seedUsers();

// scripts/seedUsers.js
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/userModel");

// Sample addresses
const homeAddress = {
  label: "Home",
  name: "Alice Johnson",
  line1: "123 Maple Street",
  line2: "Apt 4B",
  city: "Springfield",
  state: "IL",
  postal: "62701",
  country: "United States",
  phone: "+1 555-123-4567",
  isDefault: true
};

const workAddress = {
  label: "Work",
  name: "Alice Johnson",
  line1: "456 Business Blvd",
  line2: "Suite 200",
  city: "Springfield",
  state: "IL",
  postal: "62702",
  country: "United States",
  phone: "+1 555-987-6543",
  isDefault: false
};

const adminAddress = {
  label: "Office",
  name: "Charlie Admin",
  line1: "789 Admin Lane",
  city: "Springfield",
  state: "IL",
  postal: "62703",
  country: "United States",
  phone: "+1 555-000-1111",
  isDefault: true
};

const users = [
  {
    firstname: "Alice",
    lastname: "Johnson",
    email: "testuser1@example.com",
    mobile: "1234567890",
    password: "Test@1234",
    role: 'user',
    isBlocked: false,
    address: [homeAddress, workAddress] // ✅ 2 addresses
  },
  {
    firstname: "Bob",
    lastname: "Smith",
    email: "testuser2@example.com",
    mobile: "1234567891",
    password: "Test@1234",
    role: 'user', // ✅ Added missing role
    isBlocked: false,
    address: [] // ✅ Explicitly empty - no addresses
  },
  {
    firstname: "Charlie",
    lastname: "Admin",
    email: "admin@example.com",
    mobile: "1234567892",
    password: "Test@1234",
    role: 'admin',
    isBlocked: false,
    address: [adminAddress] // ✅ 1 address
  },
];

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("✅ Connected to MongoDB");

    // Clear existing test users (optional - comment out if you want to preserve data)
    // await User.deleteMany({ email: { $in: users.map(u => u.email) } });
    // console.log("🗑️ Cleared existing test users");

    // Insert users (skip if email already exists)
    for (const user of users) {
      const exists = await User.findOne({ email: user.email });
      
      if (!exists) {
        // ✅ User.create triggers pre-save hook to hash password + validate addresses
        await User.create(user);
        console.log(`✅ Created: ${user.email} with ${user.address?.length || 0} address(es)`);
      } else {
        console.log(`⚠️  Already exists: ${user.email}`);
        
        // Optional: Update addresses if user exists but addresses differ
        // Uncomment below if you want to sync addresses on re-seed
        /*
        if (user.address && user.address.length > 0) {
          await User.findOneAndUpdate(
            { email: user.email },
            { $set: { address: user.address } }
          );
          console.log(`🔄 Updated addresses for: ${user.email}`);
        }
        */
      }
    }

    // Verify seed results
    const seededUsers = await User.find({ 
      email: { $in: users.map(u => u.email) } 
    }).select('firstname lastname email address');
    
    console.log("\n📊 Seed Verification:");
    seededUsers.forEach(u => {
      console.log(`• ${u.firstname} ${u.lastname}: ${u.address?.length || 0} address(es)`);
      if (u.address?.length > 0) {
        u.address.forEach((addr, i) => {
          console.log(`  ${i + 1}. [${addr.label}] ${addr.city}, ${addr.state}`);
        });
      }
    });

    console.log("\n🎉 Seed completed successfully!");
    process.exit(0);
    
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
};

seedUsers();
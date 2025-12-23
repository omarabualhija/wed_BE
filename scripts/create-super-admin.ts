import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../src/models/User.model";

// Load environment variables
dotenv.config();

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      "mongodb://localhost:27017/wed";

    if (!mongoUri) {
      console.error("❌ MONGODB_URI not found in environment variables");
      process.exit(1);
    }

    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Check if super admin already exists
    const existingAdmin = await User.findOne({ email: "admin@wed.com" });
    if (existingAdmin) {
      console.log("ℹ️  Super admin already exists");
      await mongoose.disconnect();
      return;
    }

    // Create super admin
    const superAdmin = await User.create({
      email: "admin@wed.com",
      password: "Admin@123", // Will be hashed by pre-save hook
      name: "Super Admin",
      role: "superAdmin",
      isEmailConfirmed: true,
      isProfileComplete: true,
    });

    console.log("✅ Super admin created successfully!");
    console.log("📧 Email:", superAdmin.email);
    console.log("🔑 Password: Admin@123");
    console.log("👤 Role:", superAdmin.role);

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  } catch (error: any) {
    console.error("❌ Error creating super admin:", error.message);
    process.exit(1);
  }
};

createSuperAdmin();

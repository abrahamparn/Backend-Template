import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // Get bcrypt rounds from environment or use default
  const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || "10", 10);

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log("Cleaning up existing data");
  await prisma.userLog.deleteMany({});
  await prisma.user.deleteMany({});

  // Hash passwords
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", bcryptRounds);
  const userPassword = await bcrypt.hash("user123", bcryptRounds);
  const testPassword = await bcrypt.hash("test123", bcryptRounds);

  // Create Super Admin
  console.log("Creating Super Admin");
  const superAdmin = await prisma.user.create({
    data: {
      email: process.env.ADMIN_EMAIL || "admin@example.com",
      username: process.env.ADMIN_NAME || "superadmin",
      name: "Super Admin",
      passwordHash: adminPassword,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      profilePictureUrl: process.env.DEFAULT_PICTURE_URL || "https://via.placeholder.com/150",
      phoneNumber: "+1234567890",
    },
  });
  console.log(`✅ Created Super Admin: ${superAdmin.username} (${superAdmin.email})`);

  // Create Admin
  console.log("👤 Creating Admin...");
  const admin = await prisma.user.create({
    data: {
      email: "admin.user@example.com",
      username: "admin",
      name: "Admin User",
      passwordHash: adminPassword,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      profilePictureUrl: process.env.DEFAULT_PICTURE_URL || "https://via.placeholder.com/150",
      phoneNumber: "+1234567891",
    },
  });
  console.log(`Created Admin: ${admin.username} (${admin.email})`);

  // Create Regular Users
  console.log("👥 Creating regular users...");
  const user1 = await prisma.user.create({
    data: {
      email: "john.doe@example.com",
      username: "johndoe",
      name: "John Doe",
      passwordHash: userPassword,
      role: "USER",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      profilePictureUrl: process.env.DEFAULT_PICTURE_URL || "https://via.placeholder.com/150",
      phoneNumber: "+1234567892",
    },
  });
  console.log(`Created User: ${user1.username} (${user1.email})`);

  const user2 = await prisma.user.create({
    data: {
      email: "jane.smith@example.com",
      username: "janesmith",
      name: "Jane Smith",
      passwordHash: userPassword,
      role: "USER",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      profilePictureUrl: process.env.DEFAULT_PICTURE_URL || "https://via.placeholder.com/150",
      phoneNumber: "+1234567893",
    },
  });
  console.log(`Created User: ${user2.username} (${user2.email})`);

  // Create a test user (unverified)
  console.log("👤 Creating test user (unverified)...");
  const testUser = await prisma.user.create({
    data: {
      email: "test.user@example.com",
      username: "testuser",
      name: "Test User",
      passwordHash: testPassword,
      role: "USER",
      status: "ACTIVE",
      emailVerifiedAt: null, // Unverified
      profilePictureUrl: process.env.DEFAULT_PICTURE_URL || "https://via.placeholder.com/150",
      phoneNumber: null,
    },
  });
  console.log(`Created Test User: ${testUser.username} (${testUser.email})`);

  // Create an inactive user
  console.log("👤 Creating inactive user...");
  const inactiveUser = await prisma.user.create({
    data: {
      email: "inactive.user@example.com",
      username: "inactive",
      name: "Inactive User",
      passwordHash: userPassword,
      role: "USER",
      status: "INACTIVE",
      emailVerifiedAt: new Date(),
      profilePictureUrl: process.env.DEFAULT_PICTURE_URL || "https://via.placeholder.com/150",
    },
  });
  console.log(`Created Inactive User: ${inactiveUser.username} (${inactiveUser.email})`);

  // Create some user logs for audit trail demonstration
  console.log("Creating user logs");
  await prisma.userLog.createMany({
    data: [
      {
        action: "USER_CREATED",
        targetUserId: superAdmin.id,
        actorId: superAdmin.id,
        changedData: {
          message: "Super Admin account created during seeding",
        },
      },
      {
        action: "USER_CREATED",
        targetUserId: admin.id,
        actorId: superAdmin.id,
        changedData: {
          message: "Admin account created during seeding",
        },
      },
      {
        action: "USER_CREATED",
        targetUserId: user1.id,
        actorId: admin.id,
        changedData: {
          message: "Regular user account created during seeding",
        },
      },
      {
        action: "EMAIL_VERIFIED",
        targetUserId: user1.id,
        actorId: user1.id,
        changedData: {
          message: "Email verified during account creation",
        },
      },
    ],
  });
  console.log("Created user logs");

  console.log("\n🎉 Seeding completed successfully!\n");
  console.log("📋 Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n🔐 Login Credentials:\n");
  console.log("Super Admin:");
  console.log(`  Username: ${superAdmin.username}`);
  console.log(`  Email: ${superAdmin.email}`);
  console.log(`  Password: ${process.env.ADMIN_PASSWORD || "admin123"}`);
  console.log(`  Role: SUPER_ADMIN\n`);

  console.log("Admin:");
  console.log(`  Username: ${admin.username}`);
  console.log(`  Email: ${admin.email}`);
  console.log(`  Password: ${process.env.ADMIN_PASSWORD || "admin123"}`);
  console.log(`  Role: ADMIN\n`);

  console.log("Regular User 1:");
  console.log(`  Username: ${user1.username}`);
  console.log(`  Email: ${user1.email}`);
  console.log(`  Password: user123`);
  console.log(`  Role: USER\n`);

  console.log("Regular User 2:");
  console.log(`  Username: ${user2.username}`);
  console.log(`  Email: ${user2.email}`);
  console.log(`  Password: user123`);
  console.log(`  Role: USER\n`);

  console.log("Test User (Unverified):");
  console.log(`  Username: ${testUser.username}`);
  console.log(`  Email: ${testUser.email}`);
  console.log(`  Password: test123`);
  console.log(`  Role: USER`);
  console.log(`  ⚠️  Email not verified\n`);

  console.log("Inactive User:");
  console.log(`  Username: ${inactiveUser.username}`);
  console.log(`  Email: ${inactiveUser.email}`);
  console.log(`  Password: user123`);
  console.log(`  Role: USER`);
  console.log(`  ⚠️  Status: INACTIVE (cannot login)\n`);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => {
    console.error("Error during seeding:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

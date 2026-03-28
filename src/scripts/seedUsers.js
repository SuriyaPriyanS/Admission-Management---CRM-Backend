import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";

dotenv.config();

async function seedUsers() {
  await connectDB();

  const users = [
    {
      name: "Admin User",
      email: "admin@edumerge.com",
      password: "Admin@123",
      role: "ADMIN",
    },
    {
      name: "Admission Officer",
      email: "officer@edumerge.local",
      password: "Officer@123",
      role: "OFFICER",
    },
    {
      name: "Management Viewer",
      email: "management@edumerge.local",
      password: "Manager@123",
      role: "MANAGEMENT",
    },
  ];

  for (const user of users) {
    const existing = await User.findOne({ email: user.email });
    if (!existing) {
      const hashed = await bcrypt.hash(user.password, 10);
      await User.create({ ...user, password: hashed });
    }
  }

  // eslint-disable-next-line no-console
  console.log("Seed completed. Demo users are ready.");
  process.exit(0);
}

seedUsers().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Seed failed:", error.message);
  process.exit(1);
});


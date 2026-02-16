import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("123456", 10);

  // SUPER ADMIN
  await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "super@school.com",
      password,
      role: "SUPER_ADMIN",
    },
  });

  // ADMIN
  await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@school.com",
      password,
      role: "ADMIN",
    },
  });

  // TEACHER
  await prisma.user.create({
    data: {
      name: "Teacher User",
      email: "teacher@school.com",
      password,
      role: "TEACHER",
    },
  });

  // STUDENT
  await prisma.student.create({
    data: {
      name: "Student One",
      email: "student@school.com",
      password,
    },
  });

  // PARENT
  await prisma.parent.create({
    data: {
      name: "Parent One",
      email: "parent@school.com",
      password,
    },
  });

  console.log("Seed data inserted");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());

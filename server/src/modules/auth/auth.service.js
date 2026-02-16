//server\src\modules\auth\auth.service.js
import { prisma } from "../../config/db.js";
import { comparePassword } from "../../utils/hash.js";
import { generateToken } from "./auth.utils.js";

// ================= STAFF LOGIN =================
export const loginStaff = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) throw new Error("Invalid email or password");

  const valid = await comparePassword(password, user.password);
  if (!valid) throw new Error("Invalid email or password");

  const token = generateToken({
    id: user.id,
    accountType: "staff",
    role: user.role,
  });

  return { token, accountType: "staff", role: user.role };
};

// ================= STUDENT LOGIN =================
export const loginStudent = async (email, password) => {
  const student = await prisma.student.findUnique({
    where: { email },
  });

  if (!student) throw new Error("Invalid email or password");

  const valid = await comparePassword(password, student.password);
  if (!valid) throw new Error("Invalid email or password");

  const token = generateToken({
    id: student.id,
    accountType: "student",
  });

  return { token, accountType: "student" };
};

// ================= PARENT LOGIN =================
export const loginParent = async (email, password) => {
  const parent = await prisma.parent.findUnique({
    where: { email },
  });

  if (!parent) throw new Error("Invalid email or password");

  const valid = await comparePassword(password, parent.password);
  if (!valid) throw new Error("Invalid email or password");

  const token = generateToken({
    id: parent.id,
    accountType: "parent",
  });

  return { token, accountType: "parent" };
};

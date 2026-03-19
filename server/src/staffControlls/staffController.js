import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

// ➤ Create Staff
// Mirrors teacher pattern:
//   - schoolId comes automatically from JWT (req.user.schoolId)
//   - If email + password provided → creates User login account and links userId
//   - If no password → creates staff profile only (no login)
export async function createStaff(req, res) {
  try {
    const {
      firstName,
      lastName,
      phone,
      email,
      password,       // optional — only if staff needs a login account
      role,
      groupType,
      basicSalary,
      joiningDate,
      bankAccountNo,
      bankName,
      ifscCode,
    } = req.body;

    // ✅ schoolId comes from JWT automatically — same as teacher
    const schoolId = req.user?.schoolId;
    if (!schoolId) {
      return res.status(400).json({ error: "schoolId missing from token" });
    }

    let staff;

    if (email && password) {
      // ── CASE 1: Staff gets a login account (mirrors teacher flow exactly) ──
      staff = await prisma.$transaction(async (tx) => {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Step 1: Create User (login account) — same as teacher
        const user = await tx.user.create({
          data: {
            name: `${firstName} ${lastName || ""}`.trim(),
            email,
            password: hashedPassword,
            role: "ADMIN",    // non-teaching staff under ADMIN role
            schoolId,         // ✅ auto from JWT
          },
        });

        // Step 2: Create StaffProfile linked to both user + school
        return tx.staffProfile.create({
          data: {
            schoolId,         // ✅ auto from JWT
            userId: user.id,  // ✅ linked to login account
            firstName,
            lastName: lastName || "",
            phone: phone || null,
            email,
            role,
            groupType,
            basicSalary: basicSalary ? Number(basicSalary) : null,
            joiningDate: new Date(joiningDate),
            bankAccountNo: bankAccountNo || null,
            bankName: bankName || null,
            ifscCode: ifscCode || null,
          },
          include: { user: { select: { id: true, email: true } } },
        });
      });
    } else {
      // ── CASE 2: Staff without login (peon, watchman, plumber etc.) ──
      staff = await prisma.staffProfile.create({
        data: {
          schoolId,           // ✅ auto from JWT
          firstName,
          lastName: lastName || "",
          phone: phone || null,
          email: email || null,
          role,
          groupType,
          basicSalary: basicSalary ? Number(basicSalary) : null,
          joiningDate: new Date(joiningDate),
          bankAccountNo: bankAccountNo || null,
          bankName: bankName || null,
          ifscCode: ifscCode || null,
        },
      });
    }

    res.status(201).json({ data: staff });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Email already exists in this school" });
    }
    console.error("[createStaff]", err);
    res.status(500).json({ error: "Failed to create staff" });
  }
}

// ➤ Get All Staff
export async function getStaff(req, res) {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) {
      return res.status(400).json({ error: "schoolId missing from token" });
    }

    const staff = await prisma.staffProfile.findMany({
      where: {
        schoolId,                      // ✅ auto-scoped to this school
        NOT: { status: "RESIGNED" },   // exclude soft-deleted
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, isActive: true } },
      },
    });

    res.json({ data: staff });
  } catch (err) {
    console.error("[getStaff]", err);
    res.status(500).json({ error: "Failed to fetch staff" });
  }
}

// ➤ Update Staff
export async function updateStaff(req, res) {
  try {
    const { id } = req.params;
    const schoolId = req.user?.schoolId;

    // Security: make sure this staff belongs to the admin's school
    const existing = await prisma.staffProfile.findFirst({ where: { id, schoolId } });
    if (!existing) return res.status(404).json({ error: "Staff not found" });

    const {
      firstName,
      lastName,
      phone,
      email,
      role,
      groupType,
      basicSalary,
      joiningDate,
      bankAccountNo,
      bankName,
      ifscCode,
    } = req.body;

    // ✅ Explicitly parse types — avoids Prisma rejecting raw string for DateTime
    const updated = await prisma.staffProfile.update({
      where: { id },
      data: {
        firstName,
        lastName: lastName || "",
        phone: phone || null,
        email: email || null,
        role,
        groupType,
        basicSalary: basicSalary ? Number(basicSalary) : null,
        joiningDate: joiningDate ? new Date(joiningDate) : undefined,
        bankAccountNo: bankAccountNo || null,
        bankName: bankName || null,
        ifscCode: ifscCode || null,
      },
    });

    res.json({ data: updated });
  } catch (err) {
    console.error("[updateStaff]", err);
    res.status(500).json({ error: "Failed to update staff" });
  }
}

// ➤ Delete (soft delete)
export async function deleteStaff(req, res) {
  try {
    const { id } = req.params;
    const schoolId = req.user?.schoolId;

    const existing = await prisma.staffProfile.findFirst({ where: { id, schoolId } });
    if (!existing) return res.status(404).json({ error: "Staff not found" });

    await prisma.staffProfile.update({
      where: { id },
      data: { status: "RESIGNED" },
    });

    res.json({ message: "Staff marked as resigned" });
  } catch (err) {
    console.error("[deleteStaff]", err);
    res.status(500).json({ error: "Failed to delete staff" });
  }
}
// server/src/staffControlls/schoolAdmin.controller.js
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import redisClient from "../../utils/redis.js";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;
const CACHE_TTL = 300;

async function bustCache(universityId) {
  await redisClient.del(`school_admins:uni:${universityId}`);
}

/**
 * GET /api/school-admins
 * Returns all ADMIN users scoped to the university's schools
 */
export async function getSchoolAdmins(req, res) {
  try {
    const universityId = req.user.universityId;

    const cached = await redisClient.get(`school_admins:uni:${universityId}`);
    if (cached) return res.json({ admins: JSON.parse(cached), fromCache: true });

    const admins = await prisma.user.findMany({
      where: {
        role: { in: ["ADMIN"] },
        school: { universityId },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        schoolId: true,
        school: {
          select: { id: true, name: true, code: true, type: true },
        },
        schoolAdminProfile: true,
      },
    });

    await redisClient.setEx(
      `school_admins:uni:${universityId}`,
      CACHE_TTL,
      JSON.stringify(admins)
    );

    return res.json({ admins, fromCache: false });
  } catch (err) {
    console.error("[getSchoolAdmins]", err);
    return res.status(500).json({ message: "Failed to fetch school admins" });
  }
}

/**
 * POST /api/school-admins
 * Creates a User with role ADMIN for a specific school
 */
export async function createSchoolAdmin(req, res) {
  try {
    const {
      name,
      email,
      password,
      schoolId,
      role,

      // Admin Details
      employeeId,
      designation = "School Admin",

      phoneNumber,
      address,
      salary,

      // Identity
      panNumber,
      aadharNumber,

      // Banking
      bankName,
      accountNumber,
      ifscCode,
    } = req.body;

    const universityId = req.user.universityId;

    /* ── Basic validation ── */
    if (!name || !email || !password || !schoolId) {
      return res.status(400).json({
        message: "Name, email, password, and schoolId are required",
      });
    }

    /* ── School must belong to this university ── */
    const school = await prisma.school.findFirst({
      where: { id: schoolId, universityId },
    });
    if (!school) {
      return res.status(404).json({
        message: "School not found or does not belong to your university",
      });
    }

    /* ── Duplicate email check ── */
    const existing = await prisma.user.findUnique({
      where: { email_schoolId: { email, schoolId } },
    });
    if (existing) {
      return res.status(409).json({
        message: "An admin with this email already exists in this school",
      });
    }

    /* ── Hash password ── */
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    /* ── Parse numeric values safely ── */
    const toFloat = (v) => {
      const n = parseFloat(v);
      return isNaN(n) ? 0 : n;
    };

    /* ── Create admin + salary profile in one transaction ── */
    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "ADMIN",
        schoolId,

        schoolAdminProfile: {
          create: {
            schoolId,

            adminName: name,
            email: email,

            phoneNumber: phoneNumber || "",
            address: address || "",

            employeeId: employeeId || `ADM-${Date.now()}`,
            designation: designation || "School Admin",

            basicSalary: toFloat(salary),

            bankName: bankName || "",
            accountNumber: accountNumber || "",
            ifscCode: ifscCode || "",

            panNumber: panNumber || "",
            aadharNumber: aadharNumber || "",

            joiningDate: new Date(),
          },
        },
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        schoolId: true,
        school: {
          select: { id: true, name: true, code: true, type: true },
        },
        schoolAdminProfile: true,
      },
    });

    await bustCache(universityId);

    return res.status(201).json({
      message: "School admin created successfully ✅",
      admin,
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({
        message: "An admin with this email already exists in this school",
      });
    }
    console.error("[createSchoolAdmin]", err);
    return res.status(500).json({ message: "Failed to create school admin" });
  }
}

/**
 * PATCH /api/school-admins/:id
 * FIX: Update User fields AND schoolAdminProfile fields
 */
export async function updateSchoolAdmin(req, res) {
  try {
    const { id } = req.params;
    const universityId = req.user.universityId;

    const {
      // User-level fields
      name,
      email,
      password,
      isActive,

      // FIX: Profile fields that were previously ignored on update
      employeeId,
      designation,
      phoneNumber,
      address,
      salary,
      bankName,
      accountNumber,
      ifscCode,
      panNumber,
      aadharNumber,
    } = req.body;

    /* ── Build User-level update data ── */
    const userData = {};
    if (name     !== undefined) userData.name     = name;
    if (email    !== undefined) userData.email    = email;
    if (isActive !== undefined) userData.isActive = isActive;
    if (password) userData.password = await bcrypt.hash(password, SALT_ROUNDS);

    /* ── Build SchoolAdminProfile update data ── */
    const toFloat = (v) => {
      const n = parseFloat(v);
      return isNaN(n) ? undefined : n;
    };

    const profileData = {};
    if (name          !== undefined) profileData.adminName      = name;
    if (email         !== undefined) profileData.email          = email;
    if (employeeId    !== undefined) profileData.employeeId     = employeeId;
    if (designation   !== undefined) profileData.designation    = designation;
    if (phoneNumber   !== undefined) profileData.phoneNumber    = phoneNumber;
    if (address       !== undefined) profileData.address        = address;
    if (salary        !== undefined) profileData.basicSalary    = toFloat(salary) ?? 0;
    if (bankName      !== undefined) profileData.bankName       = bankName;
    if (accountNumber !== undefined) profileData.accountNumber  = accountNumber;
    if (ifscCode      !== undefined) profileData.ifscCode       = ifscCode;
    if (panNumber     !== undefined) profileData.panNumber      = panNumber;
    if (aadharNumber  !== undefined) profileData.aadharNumber   = aadharNumber;

    const hasProfileUpdates = Object.keys(profileData).length > 0;

    /* ── Update user (and optionally upsert profile) in one call ── */
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...userData,
        // FIX: Also update schoolAdminProfile if any profile fields were sent
        ...(hasProfileUpdates && {
          schoolAdminProfile: {
            upsert: {
              create: {
                schoolId: (await prisma.user.findUnique({ where: { id }, select: { schoolId: true } })).schoolId,
                adminName: name || "",
                email: email || "",
                ...profileData,
                joiningDate: new Date(),
              },
              update: profileData,
            },
          },
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        schoolId: true,
        school: { select: { id: true, name: true, code: true, type: true } },
        schoolAdminProfile: true,
      },
    });

    await bustCache(universityId);
    return res.json({ message: "Admin updated ✅", admin: updated });
  } catch (err) {
    console.error("[updateSchoolAdmin]", err);
    return res.status(500).json({ message: "Failed to update admin" });
  }
}

/**
 * DELETE /api/school-admins/:id
 * FIX: Hard delete — permanently removes the admin and their profile
 */
export async function deleteSchoolAdmin(req, res) {
  try {
    const { id } = req.params;
    const universityId = req.user.universityId;

    // FIX: Delete schoolAdminProfile first (if no cascade set in Prisma schema),
    // then delete the user — wrapped in a transaction so it's atomic.
    await prisma.$transaction(async (tx) => {
      // Delete profile first to avoid FK constraint errors
      await tx.schoolAdminProfile.deleteMany({ where: { userId: id } });
      // Then permanently delete the user
      await tx.user.delete({ where: { id } });
    });

    await bustCache(universityId);

    return res.json({ message: "Admin permanently deleted ✅" });
  } catch (err) {
    console.error("[deleteSchoolAdmin]", err);
    return res.status(500).json({ message: "Failed to delete admin" });
  }
}
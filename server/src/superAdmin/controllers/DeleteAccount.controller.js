// src/superadmin/DeleteAccount.controls.js

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// 🔥 DELETE SUPER ADMIN + ENTIRE SCHOOL
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    const admin = await prisma.superAdmin.findUnique({
      where: { id: userId },
    });

    console.log("ADMIN:", admin); // ✅ debug

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Super admin not found",
      });
    }

    await prisma.school.delete({
      where: { id: admin.schoolId },
    });

    return res.json({
      success: true,
      message: "Deleted successfully",
    });

  } catch (error) {
    console.error("❌ DELETE ERROR FULL:", error); // 🔥 IMPORTANT

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// server/src/utils/logoController.js
import { prisma } from "../config/db.js";
import { generateSignedUrl } from "../lib/r2.js";

export const getSchoolLogo = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    let universityId = null;

    switch (role) {
      // ── SuperAdmin: universityId lives directly on SuperAdmin row ──
      case "SUPER_ADMIN": {
        const sa = await prisma.superAdmin.findUnique({
          where: { id: userId },
          select: { universityId: true },
        });
        universityId = sa?.universityId;
        break;
      }

      // ── Staff roles: resolve schoolId → school.universityId ──
      case "ADMIN":
      case "TEACHER":
      case "FINANCE": {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { school: { select: { universityId: true } } },
        });
        universityId = user?.school?.universityId;
        break;
      }

      case "PARENT": {
        const parent = await prisma.parent.findUnique({
          where: { id: userId },
          select: { school: { select: { universityId: true } } },
        });
        universityId = parent?.school?.universityId;
        break;
      }

      case "STUDENT": {
        const student = await prisma.student.findUnique({
          where: { id: userId },
          select: { school: { select: { universityId: true } } },
        });
        universityId = student?.school?.universityId;
        break;
      }

      default:
        return res.json({ logoUrl: null });
    }

    if (!universityId) return res.json({ logoUrl: null });

    // ── Fetch logo from University table (matches superadmin flow) ──
    const university = await prisma.university.findUnique({
      where: { id: universityId },
      select: { logoUrl: true },
    });

    if (!university?.logoUrl) return res.json({ logoUrl: null });

    const signedUrl = await generateSignedUrl(university.logoUrl, 300);
    return res.json({ logoUrl: signedUrl });

  } catch (err) {
    console.error("[getSchoolLogo]", err);
    res.status(500).json({ message: "Server error" });
  }
};
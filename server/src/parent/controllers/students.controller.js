// server/src/parent/controllers/students_controller.js
// ═══════════════════════════════════════════════════════════════
//  Parent — Students List Controller + Redis caching
// ═══════════════════════════════════════════════════════════════

import { prisma } from "../../config/db.js";
import cache from "../../utils/cacheService.js";

export const getParentStudents = async (req, res) => {
  try {
    const parentId = req.user?.id;

    if (!parentId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // ── Cache check ──────────────────────────────────────────
    const cacheKey = `parent:students:${parentId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const students = await prisma.studentParent.findMany({
      where: { parentId },
      include: {
        student: {
          include: {
            personalInfo: true,
            enrollments: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
            attendanceRecords:   true,
            resultSummaries:     true,
            activityEnrollments: true,
          },
        },
      },
    });

    const result = students.map((link) => {
      const s          = link.student;
      const enrollment = s.enrollments?.[0];

      return {
        ...s,
        personalInfo:    s.personalInfo,
        admissionNumber: enrollment?.admissionNumber || null,
        rollNumber:      enrollment?.rollNumber      || null,
        attendance:      s.attendanceRecords?.length  || 0,
        gpa:             s.resultSummaries?.[0]?.gpa  || 0,
        subjects:        s.enrollments?.length         || 0,
        activities:      s.activityEnrollments?.length || 0,
      };
    });

    const response = { success: true, data: result };
    await cache.set(cacheKey, response);

    return res.json(response);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Failed to fetch students" });
  }
};
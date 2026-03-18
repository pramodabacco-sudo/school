// server/src/student/controllers/onlineClasses.controller.js

import { prisma } from "../../config/db.js";

const ok  = (res, data, status = 200) => res.status(status).json({ success: true,  ...data });
const err = (res, msg, status = 400)  => res.status(status).json({ success: false, message: msg });

// ── guard: pull studentId from token ─────────────────────────
// In the student app the JWT payload's `id` field IS the studentId
const studentGuard = (req) => {
  const studentId = req.user?.id;
  if (!studentId) throw new Error("No studentId on token");
  return studentId;
};

// ── shared include ────────────────────────────────────────────
const liveClassInclude = {
  subject:      { select: { id: true, name: true } },
  teacher: {
    select: {
      firstName: true,
      lastName:  true,
      profileImage: true,
      department: true,
    },
  },
  sections: {
    include: {
      classSection: { select: { id: true, name: true, grade: true, section: true } },
    },
  },
  academicYear: { select: { id: true, name: true, isActive: true } },
};

// ═══════════════════════════════════════════════════════════════
//  GET ALL LIVE CLASSES FOR THE STUDENT
//  — only classes whose sections include the student's current section
// ═══════════════════════════════════════════════════════════════
/**
 * GET /online-classes
 * Query: ?status=SCHEDULED|LIVE|COMPLETED|CANCELLED&academicYearId=
 */
export async function getLiveClasses(req, res) {
  try {
    const studentId = studentGuard(req);
    const { status, academicYearId } = req.query;

    // find student's active enrollment to get their classSectionId
    const enrollment = await prisma.studentEnrollment.findFirst({
      where: {
        studentId,
        status: "ACTIVE",
        ...(academicYearId ? { academicYearId } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: { classSectionId: true, academicYearId: true },
    });

    if (!enrollment) return ok(res, { data: [] });

    const liveClasses = await prisma.liveClass.findMany({
      where: {
        isArchived: false,
        academicYearId: enrollment.academicYearId,
        sections: {
          some: { classSectionId: enrollment.classSectionId },
        },
        ...(status ? { status } : {}),
      },
      include: {
        ...liveClassInclude,
        attendance: {
          where: { studentId },
          select: { isPresent: true, joinTime: true, leaveTime: true },
        },
      },
      orderBy: { startTime: "desc" },
    });

    return ok(res, { data: liveClasses });
  } catch (e) {
    console.error("[student getLiveClasses]", e);
    return err(res, e.message, 500);
  }
}

// ═══════════════════════════════════════════════════════════════
//  GET ONE
// ═══════════════════════════════════════════════════════════════
export async function getLiveClassById(req, res) {
  try {
    const studentId = studentGuard(req);

    // verify this student has access to this class
    const enrollment = await prisma.studentEnrollment.findFirst({
      where: { studentId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select: { classSectionId: true, academicYearId: true },
    });

    if (!enrollment) return err(res, "No active enrollment found", 404);

    const liveClass = await prisma.liveClass.findFirst({
      where: {
        id: req.params.id,
        isArchived: false,
        academicYearId: enrollment.academicYearId,
        sections: {
          some: { classSectionId: enrollment.classSectionId },
        },
      },
      include: {
        ...liveClassInclude,
        attendance: {
          where: { studentId },
          select: { isPresent: true, joinTime: true, leaveTime: true },
        },
      },
    });

    if (!liveClass) return err(res, "Live class not found", 404);
    return ok(res, { data: liveClass });
  } catch (e) {
    console.error("[student getLiveClassById]", e);
    return err(res, e.message, 500);
  }
}
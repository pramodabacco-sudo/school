// server/src/staffControlls/teacherLiveClassController.js

import { prisma } from "../config/db.js";

// ─── helpers (same pattern as adminActivityController) ────────
const schoolGuard = (req) => {
  const schoolId = req.user?.schoolId;
  if (!schoolId) throw new Error("No schoolId on token");
  return schoolId;
};

// AFTER
const teacherGuard = async (req) => {
  const profile = await prisma.teacherProfile.findUnique({
    where:  { userId: req.user.id },
    select: { id: true },
  });
  if (!profile) throw new Error("Teacher profile not found");
  return profile.id;
};

const ok  = (res, data, status = 200) => res.status(status).json({ success: true,  ...data });
const err = (res, msg, status = 400)  => res.status(status).json({ success: false, message: msg });

const VALID_PLATFORMS = ["ZOOM", "GOOGLE_MEET", "MICROSOFT_TEAMS", "CUSTOM"];
const VALID_STATUSES  = ["SCHEDULED", "LIVE", "COMPLETED", "CANCELLED"];

// ── shared include for list + detail ─────────────────────────
const liveClassInclude = {
  subject:  { select: { id: true, name: true } },
  sections: {
    include: {
      classSection: { select: { id: true, name: true, grade: true, section: true } },
    },
  },
  academicYear: { select: { id: true, name: true, isActive: true } },
  _count: { select: { attendance: true } },
};

// ═══════════════════════════════════════════════════════════════
//  GET ALL  — teacher sees only their own classes
// ═══════════════════════════════════════════════════════════════
/**
 * GET /api/teacher/live-classes
 * Query: ?status=SCHEDULED|LIVE|COMPLETED|CANCELLED&academicYearId=
 */
export async function getLiveClasses(req, res) {
  try {
    const schoolId  = schoolGuard(req);
    const teacherId = await teacherGuard(req);
    const { status, academicYearId } = req.query;

    const liveClasses = await prisma.liveClass.findMany({
      where: {
        schoolId,
        teacherId,
        isArchived: false,
        ...(status         ? { status }         : {}),
        ...(academicYearId ? { academicYearId } : {}),
      },
      include:  liveClassInclude,
      orderBy: { startTime: "desc" },
    });

    return ok(res, { data: liveClasses });
  } catch (e) {
    console.error("[getLiveClasses]", e);
    return err(res, e.message, 500);
  }
}

// ═══════════════════════════════════════════════════════════════
//  GET ONE
// ═══════════════════════════════════════════════════════════════
export async function getLiveClassById(req, res) {
  try {
    const schoolId  = schoolGuard(req);
    const teacherId = await teacherGuard(req);

    const liveClass = await prisma.liveClass.findFirst({
      where: { id: req.params.id, schoolId, teacherId, isArchived: false },
      include: {
        ...liveClassInclude,
        attendance: {
          include: {
            student: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!liveClass) return err(res, "Live class not found", 404);
    return ok(res, { data: liveClass });
  } catch (e) {
    console.error("[getLiveClassById]", e);
    return err(res, e.message, 500);
  }
}

// ═══════════════════════════════════════════════════════════════
//  CREATE
// ═══════════════════════════════════════════════════════════════
/**
 * POST /api/teacher/live-classes
 * Body: {
 *   title, description?,
 *   platform, meetingLink, recordingUrl?,
 *   startTime, endTime?,
 *   status?,
 *   subjectId?, academicYearId,
 *   classSectionIds[]   ← sections that can attend
 * }
 */
export async function createLiveClass(req, res) {
  try {
    const schoolId  = schoolGuard(req);
    const teacherId = await teacherGuard(req);

    const {
      title,
      description,
      platform,
      meetingLink,
      recordingUrl,
      startTime,
      endTime,
      status = "SCHEDULED",
      subjectId,
      academicYearId,
      classSectionIds = [],
    } = req.body;

    // ── validation ────────────────────────────────────────────
    if (!title?.trim())     return err(res, "title is required");
    if (!platform)          return err(res, "platform is required");
    if (!meetingLink?.trim()) return err(res, "meetingLink is required");
    if (!startTime)         return err(res, "startTime is required");
    if (!academicYearId)    return err(res, "academicYearId is required");
    if (classSectionIds.length === 0) return err(res, "At least one classSectionId is required");

    if (!VALID_PLATFORMS.includes(platform))
      return err(res, `platform must be one of: ${VALID_PLATFORMS.join(", ")}`);
    if (!VALID_STATUSES.includes(status))
      return err(res, `status must be one of: ${VALID_STATUSES.join(", ")}`);

    // ── verify academic year belongs to school ────────────────
    const ay = await prisma.academicYear.findFirst({ where: { id: academicYearId, schoolId } });
    if (!ay) return err(res, "Academic year not found");

    // ── verify subject if provided ────────────────────────────
    if (subjectId) {
      const sub = await prisma.subject.findFirst({ where: { id: subjectId, schoolId } });
      if (!sub) return err(res, "Subject not found");
    }

    const liveClass = await prisma.liveClass.create({
      data: {
        title,
        description:  description  || null,
        platform,
        meetingLink,
        recordingUrl: recordingUrl || null,
        startTime:    new Date(startTime),
        endTime:      endTime ? new Date(endTime) : null,
        status,
        teacherId,
        schoolId,
        academicYearId,
        subjectId:    subjectId || null,
        // mainSectionId = first selected section (convenience pointer)
        mainSectionId: classSectionIds[0] || null,
        sections: {
          create: classSectionIds.map((csId) => ({ classSectionId: csId })),
        },
      },
      include: liveClassInclude,
    });

    return ok(res, { data: liveClass }, 201);
  } catch (e) {
    console.error("[createLiveClass]", e);
    return err(res, e.message, 500);
  }
}

// ═══════════════════════════════════════════════════════════════
//  UPDATE
// ═══════════════════════════════════════════════════════════════
export async function updateLiveClass(req, res) {
  try {
    const schoolId  = schoolGuard(req);
    const teacherId = await teacherGuard(req);

    const existing = await prisma.liveClass.findFirst({
      where: { id: req.params.id, schoolId, teacherId, isArchived: false },
    });
    if (!existing) return err(res, "Live class not found", 404);

    const {
      title, description, platform, meetingLink, recordingUrl,
      startTime, endTime, status, subjectId, classSectionIds,
    } = req.body;

    if (platform && !VALID_PLATFORMS.includes(platform))
      return err(res, `platform must be one of: ${VALID_PLATFORMS.join(", ")}`);
    if (status && !VALID_STATUSES.includes(status))
      return err(res, `status must be one of: ${VALID_STATUSES.join(", ")}`);

    const liveClass = await prisma.$transaction(async (tx) => {
      // replace sections if provided
      if (Array.isArray(classSectionIds)) {
        await tx.liveClassSection.deleteMany({ where: { liveClassId: req.params.id } });
        await tx.liveClassSection.createMany({
          data: classSectionIds.map((csId) => ({
            liveClassId:   req.params.id,
            classSectionId: csId,
          })),
        });
      }

      return tx.liveClass.update({
        where: { id: req.params.id },
        data: {
          ...(title        !== undefined ? { title }                                    : {}),
          ...(description  !== undefined ? { description }                              : {}),
          ...(platform     !== undefined ? { platform }                                 : {}),
          ...(meetingLink  !== undefined ? { meetingLink }                              : {}),
          ...(recordingUrl !== undefined ? { recordingUrl }                             : {}),
          ...(startTime    !== undefined ? { startTime: new Date(startTime) }           : {}),
          ...(endTime      !== undefined ? { endTime: endTime ? new Date(endTime) : null } : {}),
          ...(status       !== undefined ? { status }                                   : {}),
          ...(subjectId    !== undefined ? { subjectId: subjectId || null }             : {}),
          ...(Array.isArray(classSectionIds) && classSectionIds.length > 0
            ? { mainSectionId: classSectionIds[0] }
            : {}),
        },
        include: liveClassInclude,
      });
    });

    return ok(res, { data: liveClass });
  } catch (e) {
    console.error("[updateLiveClass]", e);
    return err(res, e.message, 500);
  }
}

// ═══════════════════════════════════════════════════════════════
//  DELETE  →  soft archive (sets isArchived = true)
// ═══════════════════════════════════════════════════════════════
export async function deleteLiveClass(req, res) {
  try {
    const schoolId  = schoolGuard(req);
    const teacherId = await teacherGuard(req);

    const existing = await prisma.liveClass.findFirst({
      where: { id: req.params.id, schoolId, teacherId, isArchived: false },
    });
    if (!existing) return err(res, "Live class not found", 404);

    await prisma.liveClass.update({
      where: { id: req.params.id },
      data:  { isArchived: true, status: "CANCELLED" },
    });

    return ok(res, { message: "Live class cancelled successfully" });
  } catch (e) {
    console.error("[deleteLiveClass]", e);
    return err(res, e.message, 500);
  }
}

// ═══════════════════════════════════════════════════════════════
//  ATTENDANCE
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/teacher/live-classes/:id/attendance
 * Returns all attendance records for the class
 */
export async function getAttendance(req, res) {
  try {
    const schoolId  = schoolGuard(req);
    const teacherId = await teacherGuard(req);

    const liveClass = await prisma.liveClass.findFirst({
      where: { id: req.params.id, schoolId, teacherId },
    });
    if (!liveClass) return err(res, "Live class not found", 404);

    const records = await prisma.liveClassAttendance.findMany({
      where: { liveClassId: req.params.id },
      include: {
        student: { select: { id: true, name: true, email: true } },
      },
      orderBy: { joinTime: "asc" },
    });

    return ok(res, { data: records });
  } catch (e) {
    console.error("[getAttendance]", e);
    return err(res, e.message, 500);
  }
}

/**
 * POST /api/teacher/live-classes/:id/attendance
 * Body: { studentId, isPresent, joinTime?, leaveTime? }
 * Upserts a single attendance record (teacher can manually mark)
 */
export async function markAttendance(req, res) {
  try {
    const schoolId  = schoolGuard(req);
    const teacherId = await teacherGuard(req);

    const liveClass = await prisma.liveClass.findFirst({
      where: { id: req.params.id, schoolId, teacherId },
    });
    if (!liveClass) return err(res, "Live class not found", 404);

    const { studentId, isPresent = true, joinTime, leaveTime } = req.body;
    if (!studentId) return err(res, "studentId is required");

    const record = await prisma.liveClassAttendance.upsert({
      where: {
        liveClassId_studentId: {
          liveClassId: req.params.id,
          studentId,
        },
      },
      create: {
        liveClassId: req.params.id,
        studentId,
        isPresent,
        joinTime:  joinTime  ? new Date(joinTime)  : null,
        leaveTime: leaveTime ? new Date(leaveTime) : null,
      },
      update: {
        isPresent,
        ...(joinTime  ? { joinTime:  new Date(joinTime)  } : {}),
        ...(leaveTime ? { leaveTime: new Date(leaveTime) } : {}),
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
      },
    });

    return ok(res, { data: record });
  } catch (e) {
    console.error("[markAttendance]", e);
    return err(res, e.message, 500);
  }
}

// ═══════════════════════════════════════════════════════════════
//  DROPDOWN HELPERS
// ═══════════════════════════════════════════════════════════════

export async function getSubjectsDropdown(req, res) {
  try {
    const schoolId  = schoolGuard(req);
    const teacherId = await teacherGuard(req);

    // return only subjects this teacher is assigned to
    const assignments = await prisma.teacherAssignment.findMany({
      where: { teacherId },
      include: { subject: { select: { id: true, name: true, code: true } } },
      distinct: ["subjectId"],
    });

    const subjects = assignments.map((a) => a.subject);
    return ok(res, { data: subjects });
  } catch (e) {
    return err(res, e.message, 500);
  }
}

export async function getAcademicYearsDropdown(req, res) {
  try {
    const schoolId = schoolGuard(req);
    const years = await prisma.academicYear.findMany({
      where:   { schoolId },
      select:  { id: true, name: true, isActive: true, startDate: true, endDate: true },
      orderBy: { startDate: "desc" },
    });
    return ok(res, { data: years });
  } catch (e) {
    return err(res, e.message, 500);
  }
}

export async function getClassSectionsDropdown(req, res) {
  try {
    const schoolId  = schoolGuard(req);
    const teacherId = await teacherGuard(req);

    // return only sections this teacher is assigned to
    const assignments = await prisma.teacherAssignment.findMany({
      where: { teacherId },
      include: { classSection: { select: { id: true, name: true, grade: true, section: true } } },
      distinct: ["classSectionId"],
    });

    const sections = assignments.map((a) => a.classSection);
    return ok(res, { data: sections });
  } catch (e) {
    return err(res, e.message, 500);
  }
}


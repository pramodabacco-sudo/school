// server/src/parent/controllers/timetableController.js
// ═══════════════════════════════════════════════════════════════
//  Parent — Timetable Controller + Redis caching
// ═══════════════════════════════════════════════════════════════

import { prisma } from "../../config/db.js";
import cache from "../../utils/cacheService.js";

async function verifyParentOwnsStudent(parentId, studentId) {
  const link = await prisma.studentParent.findFirst({
    where: { parentId, studentId },
  });
  return !!link;
}

// ═══════════════════════════════════════════════════════════════
//  GET /api/parent/timetable?studentId=<uuid>
// ═══════════════════════════════════════════════════════════════
export const getTimetable = async (req, res) => {
  try {
    const parentId  = req.user?.id;
    const studentId = req.query.studentId;

    if (!parentId)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!studentId)
      return res.status(400).json({ success: false, message: "studentId is required" });

    // 1. Verify ownership
    const owns = await verifyParentOwnsStudent(parentId, studentId);
    if (!owns)
      return res.status(403).json({ success: false, message: "Access denied" });

    // ── Cache check ──────────────────────────────────────────
    const cacheKey = `parent:timetable:${studentId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    // 2. Active enrollment
    const enrollment = await prisma.studentEnrollment.findFirst({
      where: { studentId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      include: { academicYear: true, classSection: true },
    });

    if (!enrollment)
      return res.status(404).json({ success: false, message: "No active enrollment found" });

    // 3. Timetable config
    const config = await prisma.timetableConfig.findUnique({
      where: {
        schoolId_academicYearId: {
          schoolId:       enrollment.classSection.schoolId,
          academicYearId: enrollment.academicYearId,
        },
      },
      include: { periodDefinitions: { orderBy: { order: "asc" } } },
    });

    if (!config)
      return res.status(404).json({ success: false, message: "No timetable configured for this academic year" });

    // 4. Timetable entries
    const entries = await prisma.timetableEntry.findMany({
      where: {
        classSectionId: enrollment.classSectionId,
        academicYearId: enrollment.academicYearId,
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        teacher: { include: { user: { select: { name: true } } } },
        periodDefinition: true,
      },
    });

    // 5. Build lookup: day → periodNumber → entry
    const entryMap = {};
    for (const e of entries) {
      const day = e.day;
      const pn  = e.periodDefinition.periodNumber;
      if (!entryMap[day]) entryMap[day] = {};
      entryMap[day][pn] = e;
    }

    // 6. Group period definitions by day type
    const weekdayDefs  = config.periodDefinitions.filter(p => p.dayType === "WEEKDAY");
    const saturdayDefs = config.periodDefinitions.filter(p => p.dayType === "SATURDAY");

    const WEEKDAYS  = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
    const SATURDAYS = ["SATURDAY"];

    const allDays = [];
    if (weekdayDefs.length  > 0) allDays.push(...WEEKDAYS);
    if (saturdayDefs.length > 0) allDays.push(...SATURDAYS);

    // 7. Build timetable map per day
    const timetable = {};
    for (const day of allDays) {
      const defs = SATURDAYS.includes(day) ? saturdayDefs : weekdayDefs;
      timetable[day] = defs.map((def) => {
        const entry = entryMap[day]?.[def.periodNumber];
        return {
          id:           def.id,
          periodNumber: def.periodNumber,
          label:        def.label,
          slotType:     def.slotType,
          startTime:    def.startTime,
          endTime:      def.endTime,
          subject: entry
            ? { id: entry.subject.id, name: entry.subject.name, code: entry.subject.code }
            : null,
          teacher:    entry ? { name: entry.teacher?.user?.name ?? null } : null,
          roomNumber: null,
        };
      });
    }

    // 8. Stats
    const allDefs   = [...weekdayDefs, ...saturdayDefs];
    const periodDefs = allDefs.filter(d => d.slotType === "PERIOD");
    const times     = allDefs.filter(d => d.startTime && d.endTime);
    const dayStart  = times.length > 0
      ? times.reduce((min, d) => d.startTime < min ? d.startTime : min, times[0].startTime)
      : null;
    const dayEnd = times.length > 0
      ? times.reduce((max, d) => d.endTime > max ? d.endTime : max, times[0].endTime)
      : null;

    const response = {
      success: true,
      data: {
        enrollment: {
          className:       enrollment.classSection.name,
          academicYear:    enrollment.academicYear.name,
          admissionNumber: enrollment.admissionNumber,
        },
        days: allDays,
        timetable,
        stats: {
          workingDays:  allDays.length,
          dayStart,
          dayEnd,
          totalPeriods: periodDefs.length,
        },
      },
    };

    await cache.set(cacheKey, response);
    return res.json(response);

  } catch (err) {
    console.error("[parent/getTimetable]", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
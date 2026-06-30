// server/src/parent/controllers/attendance_controller.js
// ═══════════════════════════════════════════════════════════════
//  Parent — Attendance Controller + Redis caching
//  UPDATED: now returns BOTH manual and biometric attendance info
//    - source: "manual" | "biometric"  (derived from markedById)
//    - markedByName: teacher name, when source === "manual"
//    - firstPunchFmt / lastPunchFmt / workedFmt: from BiometricLog,
//      shown whenever a punch exists for that day — REGARDLESS of
//      who/what set the final status (teacher override still shows
//      the underlying punch as supporting evidence).
// ═══════════════════════════════════════════════════════════════

import { prisma } from "../../config/db.js";
import cache from "../../utils/cacheService.js";

const mapStatus = (status) => {
  if (status === "PRESENT") return "present";
  if (status === "ABSENT")  return "absent";
  return "holiday";
};

const fmtTime = (dt) =>
  dt
    ? new Date(dt).toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : null;

// Key by local YYYY-MM-DD (date-only) so a record's `date` column,
// which is stored at local midnight, lines up with grouped punch logs.
const dayKey = (d) => new Date(d).toISOString().slice(0, 10);

export const getStudentAttendance = async (req, res) => {
  try {
    const studentId = req.query.studentId;
    if (!studentId) {
      return res.status(400).json({ success: false, message: "studentId is required" });
    }

    const { year, month } = req.query;
    if (!year || !month) {
      return res.status(400).json({ success: false, message: "Year and month are required" });
    }

    // ── Cache check ──────────────────────────────────────────
    const cacheKey = `parent:attendance:${studentId}:${year}:${month}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    // ── Active enrollment ─────────────────────────────────────
    const enrollment = await prisma.studentEnrollment.findFirst({
      where: { studentId, status: "ACTIVE" },
      include: { classSection: true },
    });

    // ── Date range ────────────────────────────────────────────
    const startDate = new Date(year, month - 1, 1);
    const endDate   = new Date(year, month, 0, 23, 59, 59, 999);

    // ── Attendance records (now also pulling who marked it) ───
    const records = await prisma.attendanceRecord.findMany({
      where: {
        studentId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: "asc" },
      select: {
        date: true,
        status: true,
        markedById: true,
        markedBy: { select: { name: true } },
      },
    });

    // ── Biometric punches for the same month (independent of status) ──
    const biometricLogs = await prisma.biometricLog.findMany({
      where: {
        studentId,
        personType: "STUDENT",
        punchDateTime: { gte: startDate, lte: endDate },
      },
      select: { punchDateTime: true },
      orderBy: { punchDateTime: "asc" },
    });

    // Group punches by day → first/last punch (in/out) + worked time
    const punchByDay = new Map();
    biometricLogs.forEach((log) => {
      if (!log.punchDateTime) return;
      const key = dayKey(log.punchDateTime);
      if (!punchByDay.has(key)) {
        punchByDay.set(key, { first: log.punchDateTime, last: log.punchDateTime, count: 0 });
      }
      const g = punchByDay.get(key);
      g.count++;
      if (log.punchDateTime < g.first) g.first = log.punchDateTime;
      if (log.punchDateTime > g.last)  g.last  = log.punchDateTime;
    });

    const punchInfoFor = (date) => {
      const g = punchByDay.get(dayKey(date));
      if (!g) return { hasPunch: false, firstPunchFmt: null, lastPunchFmt: null, workedFmt: null };
      const sameTime = g.first.getTime() === g.last.getTime();
      const workedMinutes = !sameTime ? Math.floor((g.last - g.first) / 60000) : null;
      return {
        hasPunch: true,
        firstPunchFmt: fmtTime(g.first),
        lastPunchFmt:  !sameTime ? fmtTime(g.last) : null,
        workedFmt:     workedMinutes != null ? `${Math.floor(workedMinutes / 60)}h ${workedMinutes % 60}m` : null,
      };
    };

    // ── Stats ─────────────────────────────────────────────────
    let present = 0;
    let absent  = 0;
    records.forEach((r) => {
      if (r.status === "PRESENT") present++;
      else if (r.status === "ABSENT") absent++;
    });

    const totalDays  = records.length;
    const percentage = totalDays
      ? Number(((present / totalDays) * 100).toFixed(1))
      : 0;

    // ── Calendar ──────────────────────────────────────────────
    const recordMap = new Map();
    records.forEach((r) => {
      const day = new Date(r.date).getDate();
      recordMap.set(day, r);
    });

    const daysInMonth = new Date(year, month, 0).getDate();
    const calendarDays = [];

    for (let day = 1; day <= daysInMonth; day++) {
      if (recordMap.has(day)) {
        const r = recordMap.get(day);
        const punch = punchInfoFor(r.date);
        calendarDays.push({
          date:   day.toString(),
          status: mapStatus(r.status),
          source: r.markedById ? "manual" : "biometric",
          markedByName: r.markedById ? (r.markedBy?.name ?? "Teacher") : null,
          ...punch,
        });
      } else {
        const currentDate = new Date(year, month - 1, day);
        const today = new Date();
        calendarDays.push({
          date:   day.toString(),
          status: currentDate > today ? "upcoming" : "holiday",
          source: null,
          markedByName: null,
          hasPunch: false,
          firstPunchFmt: null,
          lastPunchFmt: null,
          workedFmt: null,
        });
      }
    }

    // ── Recent records ────────────────────────────────────────
    const recentRecords = records
      .slice(-7)
      .reverse()
      .map((r) => {
        const punch = punchInfoFor(r.date);
        return {
          date:   new Date(r.date).toLocaleDateString(),
          day:    new Date(r.date).toLocaleDateString("en-US", { weekday: "short" }),
          status: mapStatus(r.status),
          source: r.markedById ? "manual" : "biometric",
          markedByName: r.markedById ? (r.markedBy?.name ?? "Teacher") : null,
          ...punch,
        };
      });

    // ── Available months ──────────────────────────────────────
    const allRecords = await prisma.attendanceRecord.findMany({
      where:  { studentId },
      select: { date: true },
    });

    const monthMap = new Map();
    allRecords.forEach((r) => {
      const d   = new Date(r.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!monthMap.has(key)) {
        monthMap.set(key, {
          year:  d.getFullYear(),
          month: d.getMonth() + 1,
          label: d.toLocaleString("default", { month: "short", year: "numeric" }),
        });
      }
    });

    const availableMonths = Array.from(monthMap.values());

    // ── Build & cache response ────────────────────────────────
    const response = {
      success: true,
      data: {
        stats: { totalDays, present, absent, percentage },
        calendarDays,
        recentRecords,
        availableMonths,
        selectedMonth: startDate.toLocaleString("default", { month: "short", year: "numeric" }),
        enrollment: enrollment
          ? {
              className:       enrollment.classSection.name,
              admissionNumber: enrollment.admissionNumber,
            }
          : null,
      },
    };

    await cache.set(cacheKey, response);
    return res.json(response);

  } catch (error) {
    console.error("Attendance Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch attendance" });
  }
};
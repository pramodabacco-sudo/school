import { PrismaClient } from "@prisma/client";

const mapStatus = (status) => {
  if (status === "PRESENT") return "present";
  if (status === "ABSENT") return "absent";
  return "holiday";
};

export const getStudentAttendance = async (req, res) => {
  try {
    const prisma = new PrismaClient();
    const studentId = req.user.id; // assuming student login
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: "Year and month are required",
      });
    }

    // ✅ Get active enrollment
    const enrollment = await prisma.studentEnrollment.findFirst({
      where: {
        studentId,
        status: "ACTIVE",
      },
      include: {
        classSection: true,
      },
    });

    // ✅ Date range
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // ✅ Attendance records
    const records = await prisma.attendanceRecord.findMany({
      where: {
        studentId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    });

    // ✅ Stats
    let present = 0;
    let absent = 0;

    records.forEach((r) => {
      if (r.status === "PRESENT") present++;
      else if (r.status === "ABSENT") absent++;
    });

    const totalDays = records.length;
    const percentage = totalDays
      ? Number(((present / totalDays) * 100).toFixed(1))
      : 0;

    // ✅ Calendar (IMPORTANT FORMAT FOR UI)
    const calendarDays = records.map((r) => ({
      date: new Date(r.date).getDate().toString(),
      status: mapStatus(r.status),
    }));

    // ✅ Recent records
    const recentRecords = records
      .slice(-7)
      .reverse()
      .map((r) => ({
        date: new Date(r.date).toLocaleDateString(),
        day: new Date(r.date).toLocaleDateString("en-US", {
          weekday: "short",
        }),
        status: mapStatus(r.status),
      }));

    // ✅ Available months
    const allRecords = await prisma.attendanceRecord.findMany({
      where: { studentId },
      select: { date: true },
    });

    const monthMap = new Map();

    allRecords.forEach((r) => {
      const d = new Date(r.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;

      if (!monthMap.has(key)) {
        monthMap.set(key, {
          year: d.getFullYear(),
          month: d.getMonth() + 1,
          label: d.toLocaleString("default", {
            month: "short",
            year: "numeric",
          }),
        });
      }
    });

    const availableMonths = Array.from(monthMap.values());

    // ✅ FINAL RESPONSE (MATCHES FRONTEND)
    return res.json({
      success: true,
      data: {
        stats: {
          totalDays,
          present,
          absent,
          percentage,
        },
        calendarDays,
        recentRecords,
        availableMonths,
        selectedMonth: startDate.toLocaleString("default", {
          month: "short",
          year: "numeric",
        }),
        enrollment: enrollment
          ? {
              className: enrollment.classSection.name,
              admissionNumber: enrollment.admissionNumber,
            }
          : null,
      },
    });

  } catch (error) {
    console.error("Attendance Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance",
    });
  }
};
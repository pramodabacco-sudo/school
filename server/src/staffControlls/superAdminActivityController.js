// server/src/staffControlls/superAdminActivityController.js

import { prisma } from "../config/db.js";
import { getAccessibleSchoolIds } from "../utils/schoolAccess.js";

export const getSuperAdminActivities = async (req, res) => {
  try {
    const schools = await getAccessibleSchoolIds(req);

    const schoolIds = schools.map((s) => s.id);

    const activities = await prisma.activity.findMany({
      where: {
        schoolId: {
          in: schoolIds,
        },
        isArchived: false,
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        academicYear: true,

        _count: {
          select: {
            enrollments: true,
            events: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSuperAdminActivityById = async (req, res) => {
  try {
    const schools = await getAccessibleSchoolIds(req);

    const schoolIds = schools.map((s) => s.id);

    const activity = await prisma.activity.findFirst({
      where: {
        id: req.params.id,
        schoolId: {
          in: schoolIds,
        },
      },
      include: {
        school: true,
        academicYear: true,

        enrollments: {
          include: {
            student: {
              include: {
                personalInfo: true,
              },
            },
          },
        },

        events: true,
      },
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    res.json({
      success: true,
      data: activity,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
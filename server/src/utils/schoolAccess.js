// server/src/utils/schoolAccess.js

import { prisma } from "../config/db.js";

export const getAccessibleSchoolIds = async (req) => {
  const universityId =
    req.user?.universityId ||
    req.user?.university?.id;

  if (!universityId) {
    throw new Error("UniversityId missing in token");
  }

  const schools = await prisma.school.findMany({
    where: {
      universityId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
    },
  });

  return schools;
};